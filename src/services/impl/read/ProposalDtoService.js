import BaseService from './../../base/BaseService';
import { APP_PROPOSAL, PROPOSAL_STATUS } from '@deip/constants';
import ProposalSchema from './../../../schemas/ProposalSchema';
import { PROJECT_STATUS } from './../../../constants';
import ProjectDtoService from './ProjectDtoService';
import TeamDtoService from './TeamDtoService';
import UserDtoService from './UserDtoService';
import InvestmentOpportunityDtoService from './InvestmentOpportunityDtoService';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';

const userDtoService = new UserDtoService({ scoped: false });
const teamDtoService = new TeamDtoService({ scoped: false });
const projectDtoService = new ProjectDtoService({ scoped: false });
const invstOppDtoService = new InvestmentOpportunityDtoService({ scoped: false });


class ProposalDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(ProposalSchema, options);
  }

  
  async mapProposals(proposals, extended = true) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainProposals = await Promise.all(proposals.map((proposal) => chainRpc.getProposalAsync(proposal._id)));

    const names = proposals.reduce((names, proposal) => {
      const chainProposal = chainProposals.filter((chainProposal) => !!chainProposal).find((chainProposal) => chainProposal.proposalId == proposal._id);
      
      if (!chainProposal)
        return names;

      if (!names.some((n) => n == chainProposal.creator)) {
        names.push(chainProposal.creator);
      }

      for (let i = 0; i < chainProposal.decisionMakers.length; i++) {
        let name = chainProposal.decisionMakers[i];
        if (!names.some((n) => n == name)) {
          names.push(name);
        }
      }

      for (let i = 0; i < chainProposal.approvers.length; i++) {
        const name = chainProposal.approvers[i];
        if (!names.some((n) => n == name)) {
          names.push(name);
        }
      }

      for (let i = 0; i < chainProposal.rejectors.length; i++) {
        const name = chainProposal.rejectors[i];
        if (!names.some((n) => n == name)) {
          names.push(name);
        }
      }

      return names;
    }, []);

    const chainAccounts = await chainRpc.getAccountsAsync(names);
    const teams = await teamDtoService.getTeams(names);
    const users = await userDtoService.getUsers(names);
    const result = [];


    for (let i = 0; i < proposals.length; i++) {
      const proposal = proposals[i];
      const chainProposal = chainProposals.filter((chainProposal) => !!chainProposal).find((chainProposal) => chainProposal.proposalId == proposal._id);
      if (!chainProposal) {
        console.warn(`Proposal with ID '${proposal._id}' is not found in the Chain`);
      }

      const parties = {};
      for (let j = 0; j < proposal.decisionMakers.length; j++) {
        const party = proposal.decisionMakers[j];
        const key = `party${j + 1}`;

        const chainAccount = chainAccounts.find(chainAccount => chainAccount.daoId == party);
        if (chainAccount) {
          const signatories = await this.getPossibleSignatories(chainAccount);
          const members = [...signatories];
          const possibleSigners = members.reduce((acc, name) => {
            if (!acc.some(n => n == name) && !proposal.decisionMakers.some(a => a == name)) {
              return [...acc, name];
            }
            return [...acc];
          }, []);

          let isApproved = members.some(member => proposal.approvers.some((name) => name == member)) || proposal.approvers.some((name) => name == party);
          let isRejected = members.some(member => proposal.rejectors.some((name) => name == member)) || proposal.rejectors.some((name) => name == party);
          let isHidden = false;

          // TODO: move to event handler
          if (proposal.type == APP_PROPOSAL.PROJECT_NDA_PROPOSAL) {
            isHidden = teams.some(({ tenantId }) => chainAccount.daoId === tenantId);
            if (!isApproved && !isRejected && proposal.status != PROPOSAL_STATUS.PENDING) {
              const team = teams.find(team => team._id == party);
              if (team._id == team.tenantId) {
                if (proposal.status == PROPOSAL_STATUS.REJECTED)
                  isRejected = true;
                if (proposal.status == PROPOSAL_STATUS.APPROVED)
                  isApproved = true;
              }
            }
          }

          parties[key] = {
            isProposer: party == proposal.creator,
            status: isApproved ? PROPOSAL_STATUS.APPROVED : isRejected ? PROPOSAL_STATUS.REJECTED : PROPOSAL_STATUS.PENDING,
            account: users.find(user => user._id == party) || teams.find(team => team._id == party),
            isHidden,
            signers: [
              ...users.filter((user) => possibleSigners.some(member => user._id == member) || user._id == party),
              ...teams.filter((team) => possibleSigners.some(member => team._id == member) || team._id == party),
            ]
              .filter((signer) => {
                return proposal.approvers.some((name) => name == signer._id) || proposal.rejectors.some((name) => name == signer._id);
              })
              .map((signer) => {
                return {
                  signer: signer,
                  txInfo: null // TODO: move to event handler
                }
              })
          }
        }
      }

      result.push({
        _id: proposal._id,
        tenantId: proposal.tenantId,
        cmd: proposal.cmd,
        proposer: proposal.creator,
        parties: parties,
        type: proposal.type,
        status: chainProposal ? chainProposal.status : proposal.status,
        decisionMakers: chainProposal ? chainProposal.decisionMakers : proposal.decisionMakers,
        approvers: chainProposal ? chainProposal.approvers : proposal.approvers,
        rejectors: chainProposal ? chainProposal.rejectors : proposal.rejectors,

        // @deprecated
        entityId: proposal._id,
        details: proposal.details,
        proposal: chainProposal || null,
      })
    }

    if (!extended) 
      return result;

    try {
      // @deprecated
      const extendedProposals = await this.extendProposalsDetails(result);
      return extendedProposals;
    } catch(err) {
      console.error(err);
      return result;
    }

  }


  async getPossibleSignatories(account, checkAccounts = []) {
    const accounts = [];

    const members = [...account.authority.owner.auths.map((auth) => auth.daoId)]
      .filter(daoId => !checkAccounts.includes(daoId));

    if (members.length === 0) {
      return [];
    }

    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const chainAccounts = await chainRpc.getAccountsAsync(members);
    accounts.push(...members);

    for (let i = 0; i < chainAccounts.length; i++) {
      const chainAccount = chainAccounts[i];
      const team = await teamDtoService.getTeam(chainAccount.daoId);
      if (team) {
        const daoIds = await this.getPossibleSignatories(chainAccount, accounts);
        accounts.push(...daoIds);
      }
    }
    return [...accounts];
  }
  
  async extendProposalsDetails(proposals) {
    const result = [];
    const grouped = proposals.reduce((acc, proposal) => {
      acc[proposal.type] = acc[proposal.type] || [];
      acc[proposal.type].push(proposal);
      return acc;
    }, {});

    const contractAgreementContracts = await this.extendContractAgreementProposals(grouped[APP_PROPOSAL.CONTRACT_AGREEMENT_PROPOSAL] || []);
    result.push(...contractAgreementContracts);

    const assetExchangesProposals = await this.extendAssetExchangeProposals(grouped[APP_PROPOSAL.ASSET_EXCHANGE_PROPOSAL] || []);
    result.push(...assetExchangesProposals);

    const assetTransfersProposals = await this.extendAssetTransferProposals(grouped[APP_PROPOSAL.ASSET_TRANSFER_PROPOSAL] || []);
    result.push(...assetTransfersProposals);

    const researchProposals = await this.extendResearchProposals(grouped[APP_PROPOSAL.PROJECT_PROPOSAL] || []);
    result.push(...researchProposals);

    const researchUpdateProposals = await this.extendResearchUpdateProposals(grouped[APP_PROPOSAL.PROJECT_UPDATE_PROPOSAL] || []);
    result.push(...researchUpdateProposals);

    const researchGroupUpdateProposals = await this.extendResearchGroupUpdateProposals(grouped[APP_PROPOSAL.TEAM_UPDATE_PROPOSAL] || []);
    result.push(...researchGroupUpdateProposals);

    const researchContentProposals = await this.extendResearchContentProposals(grouped[APP_PROPOSAL.PROJECT_CONTENT_PROPOSAL] || []);
    result.push(...researchContentProposals);

    const researchTokenSaleProposals = await this.extendResearchTokenSaleProposals(grouped[APP_PROPOSAL.PROJECT_FUNDRASE_PROPOSAL] || []);
    result.push(...researchTokenSaleProposals);

    const userInvitationProposals = await this.extendUserInvitationProposals(grouped[APP_PROPOSAL.ADD_DAO_MEMBER_PROPOSAL] || []);
    result.push(...userInvitationProposals);

    const userLeavingProposals = await this.extendUserLeavingProposals(grouped[APP_PROPOSAL.REMOVE_DAO_MEMBER_PROPOSAL] || []);
    result.push(...userLeavingProposals);

    const researchNdaProposals = await this.extendResearchNdaProposals(grouped[APP_PROPOSAL.PROJECT_NDA_PROPOSAL] || []);
    result.push(...researchNdaProposals);

    return result;
  }


  async extendContractAgreementProposals(requests) {
    const accountNames = requests.reduce((acc, req) => {
      if (!acc.some(a => a == req.details.creator)) {
        acc.push(req.details.creator);
      }
      return acc;
    }, []);

    const projectIds = requests.reduce((acc, req) => {
      if (!acc.some(r => r == req.details.projectId)) {
        acc.push(req.details.projectId);
      }
      return acc;
    }, []);


    // currently we allow to buy the license only for user account
    const users = await userDtoService.getUsers(accountNames);
    const projects = await projectDtoService.getProjects(projectIds, Object.values(PROJECT_STATUS));

    return requests.map((req) => {
      const extendedDetails = {
        requester: users.find(u => u.account.name == req.details.creator),
        research: projects.find(p => p._id == req.details.projectId)
      }
      return { ...req, extendedDetails };
    })
  }

  async extendAssetExchangeProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.party1)) {
        acc.push(proposal.details.party1);
      }
      if (!acc.some(a => a == proposal.details.party2)) {
        acc.push(proposal.details.party2);
      }
      return acc;
    }, []);

    const users = await userDtoService.getUsers(accountNames);
    const teams = await teamDtoService.getTeams(accountNames)

    return proposals.map((proposal) => {
      const party1 = teams.find(team => team._id == proposal.details.party1) || users.find(user => user._id == proposal.details.party1);
      const party2 = teams.find(team => team._id == proposal.details.party2) || users.find(user => user._id == proposal.details.party2);
      const extendedDetails = { party1, party2 };
      return { ...proposal, extendedDetails };
    });
  }

  async extendAssetTransferProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.party1)) {
        acc.push(proposal.details.party1);
      }
      if (!acc.some(a => a == proposal.details.party2)) {
        acc.push(proposal.details.party2);
      }
      return acc;
    }, []);

    const users = await userDtoService.getUsers(accountNames);
    const teams = await teamDtoService.getTeams(accountNames)

    return proposals.map((proposal) => {
      const party1 = teams.find(team => team._id == proposal.details.party1) || users.find(user => user._id == proposal.details.party1);
      const party2 = teams.find(team => team._id == proposal.details.party2) || users.find(user => user._id == proposal.details.party2);
      const extendedDetails = { party1, party2 };
      return { ...proposal, extendedDetails };
    })
  }

  async extendResearchProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchGroupExternalId)) {
        acc.push(proposal.details.researchGroupExternalId);
      }
      return acc;
    }, []);

    const teams = await teamDtoService.getTeams(accountNames.map(a => a));
    return proposals.map((proposal) => {
      const researchGroup = teams.find(team => team._id == proposal.details.researchGroupExternalId);
      const extendedDetails = { researchGroup };
      return { ...proposal, extendedDetails };
    });
  }


  async extendResearchUpdateProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.teamId)) {
        acc.push(proposal.details.teamId);
      }
      return acc;
    }, []);

    const projectsIds = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.projectId)) {
        acc.push(proposal.details.projectId);
      }
      return acc;
    }, []);

    const teams = await teamDtoService.getTeams(accountNames);
    const projects = await projectDtoService.getProjects(projectsIds, Object.values(PROJECT_STATUS));

    return proposals.map((proposal) => {
      const team = teams.find(team => team._id == proposal.details.teamId);
      const project = projects.find(project => project._id == proposal.details.projectId);
      const extendedDetails = { researchGroup: team, research: project };
      return { ...proposal, extendedDetails };
    });
  }


  async extendResearchGroupUpdateProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchGroupExternalId)) {
        acc.push(proposal.details.researchGroupExternalId);
      }
      return acc;
    }, []);

    const teams = await teamDtoService.getTeams(accountNames);
    return proposals.map((proposal) => {
      const team = teams.find(team => team._id == proposal.details.researchGroupExternalId);
      const extendedDetails = { researchGroup: team };
      return { ...proposal, extendedDetails };
    });
  }


  async extendResearchContentProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchGroupExternalId)) {
        acc.push(proposal.details.researchGroupExternalId);
      }
      return acc;
    }, []);

    const researchExternalIds = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchExternalId)) {
        acc.push(proposal.details.researchExternalId);
      }
      return acc;
    }, []);

    const teams = await teamDtoService.getTeams(accountNames);
    const researches = await projectDtoService.getProjects(researchExternalIds, Object.values(PROJECT_STATUS));

    return proposals.map((proposal) => {
      const team = teams.find(team => team._id == proposal.details.researchGroupExternalId);
      const project = researches.find(project => project._id == proposal.details.researchExternalId);
      const extendedDetails = { researchGroup: team, research: project };
      return { ...proposal, extendedDetails };
    });
  }

  async extendResearchTokenSaleProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchGroupExternalId)) {
        acc.push(proposal.details.researchGroupExternalId);
      }
      return acc;
    }, []);

    const projectsIds = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchExternalId)) {
        acc.push(proposal.details.researchExternalId);
      }
      return acc;
    }, []);

    const invstOppsIds = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchTokenSaleExternalId)) {
        acc.push(proposal.details.researchTokenSaleExternalId);
      }
      return acc;
    }, []);


    const teams = await teamDtoService.getTeams(accountNames);
    const projects = await projectDtoService.getProjects(projectsIds, Object.values(PROJECT_STATUS));
    const invstOpps = await invstOppDtoService.getInvstOpps(invstOppsIds);

    return proposals.map((proposal) => {
      const team = teams.find(team => team._id == proposal.details.researchGroupExternalId);
      const project = projects.find(project => project._id == proposal.details.researchExternalId);
      const invstOpp = invstOpps.find(invstOpp => invstOpp._id == proposal.details.researchTokenSaleExternalId);

      const extendedDetails = { 
        researchGroup: team, 
        research: project, 
        researchTokenSale: { 
          ...invstOpp, 
          soft_cap: invstOpp.softCap, 
          hard_cap: invstOpp.hardCap, 
          security_tokens_on_sale: invstOpp.shares 
        }
      };
      return { ...proposal, extendedDetails };
    });

  }


  async extendUserInvitationProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.invitee)) {
        acc.push(proposal.details.invitee);
      }
      if (!acc.some(a => a == proposal.details.teamId)) {
        acc.push(proposal.details.teamId);
      }
      return acc;
    }, []);

    const users = await userDtoService.getUsers(accountNames);
    const teams = await teamDtoService.getTeams(accountNames)

    return proposals.map((proposal) => {
      const team = teams.find(team => team._id == proposal.details.teamId);
      const invitee = users.find(users => users._id == proposal.details.invitee);
      const extendedDetails = { researchGroup: team, invitee };
      return { ...proposal, extendedDetails };
    });
  }


  async extendUserLeavingProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.member)) {
        acc.push(proposal.details.member);
      }
      if (!acc.some(a => a == proposal.details.teamId)) {
        acc.push(proposal.details.teamId);
      }
      return acc;
    }, []);

    const users = await userDtoService.getUsers(accountNames);
    const teams = await teamDtoService.getTeams(accountNames);

    return proposals.map((proposal) => {
      const team = teams.find(team => team._id == proposal.details.teamId);
      const member = users.find(user => user._id == proposal.details.member);
      const extendedDetails = { researchGroup: team, member };
      return { ...proposal, extendedDetails };
    });

  }

  async extendResearchNdaProposals(proposals) {
    const projectIds = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.projectId)) {
        acc.push(proposal.details.projectId);
      }
      return acc;
    }, []);

    const projects = await projectDtoService.getProjects(projectIds, Object.values(PROJECT_STATUS));

    return proposals.map(proposal => {
      const project = projects.find(project => project._id == proposal.details.projectId);
      return { ...proposal, extendedDetails: { research: project } };
    })
  }

  
  async getAccountProposals(username) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainAccount = await chainRpc.getAccountAsync(username);
    const signatories = await this.getPossibleSignatories(chainAccount);
    const proposals = await this.findMany({ decisionMakers: { $in: [...signatories] } });
    const result = await this.mapProposals(proposals);
    return result;
  }


  async getProposal(externalId) {
    const proposal = await this.findOne({ _id: externalId });
    if (!proposal) return null;
    const [result] = await this.mapProposals([proposal]);
    return result;
  }


  async getProposals(externalIds) {
    const proposals = await this.findMany({ _id: { $in: [...externalIds] } });
    const result = await this.mapProposals(proposals);
    return result;
  }


}

export default ProposalDtoService;