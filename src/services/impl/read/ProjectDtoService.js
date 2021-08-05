import deipRpc from '@deip/rpc-client';
import BaseService from './../../base/BaseService';
import ProjectSchema from './../../../schemas/ProjectSchema'; // TODO: separate read/write schemas
import ExpressLicensingService from './../../legacy/expressLicensing';
import ResearchNdaService from './../../legacy/researchNda';
import AttributeDtoService from './AttributeDtoService';
import { ATTRIBUTE_TYPE, RESEARCH_ATTRIBUTE, RESEARCH_STATUS, ATTR_SCOPES } from './../../../constants';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';
import config from './../../../config';

import { ChainService } from '@deip/chain-service';

class ProjectDtoService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ProjectSchema, options);
  }

  async mapResearch(researches, filterObj) {
    const expressLicensingService = new ExpressLicensingService();
    const researchNdaService = new ResearchNdaService();
    const attributeDtoService = new AttributeDtoService()

    const filter = {
      searchTerm: "",
      researchAttributes: [],
      tenantIds: [],
      isDefault: undefined,
      ...filterObj
    }

    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const chainResearches = await chainApi.getProjectsAsync(researches.map(r => r._id));

    const researchesExpressLicenses = await expressLicensingService.getExpressLicensesByResearches(chainResearches.map(r => r.external_id));
    const chainResearchNdaList = await Promise.all(chainResearches.map(r => researchNdaService.getResearchNdaListByResearch(r.external_id)));
    const researchAttributes = await attributeDtoService.getAttributesByScope(ATTR_SCOPES.PROJECT);
    const refs = await chainApi.getTeamMemberReferencesAsync(chainResearches.map(p => p.research_group.external_id), false);
    const allMembers = refs.map((g) => g.map(m => m.account));
    
    return chainResearches
      .map((chainResearch, i) => {
        const members = allMembers[i];
        const researchRef = researches.find(r => r._id.toString() == chainResearch.external_id);
        const expressLicenses = researchesExpressLicenses.filter(l => l.researchExternalId == chainResearch.external_id);
        // TEMP
        const grantedAccess = chainResearchNdaList
          .reduce((acc, list) => { return [...acc, ...list] }, [])
          .filter((nda) => nda.research_external_id == chainResearch.external_id)
          .reduce((acc, nda) => {
            return [...acc, ...nda.parties];
          }, []);

        const attributes = researchRef.attributes;
       
        const title = attributes.some(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString())
          ? attributes.find(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString()).value.toString()
          : "Not Specified";

        const abstract = attributes.some(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.DESCRIPTION.toString())
          ? attributes.find(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.DESCRIPTION.toString()).value.toString()
          : "Not Specified";

        const isPrivate = attributes.some(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.IS_PRIVATE.toString())
          ? attributes.find(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.IS_PRIVATE.toString()).value.toString() === 'true'
          : false;

        return {
          ...chainResearch,
          members,
          entityId: chainResearch.external_id,
          tenantId: researchRef.tenantId,
          title,
          abstract,
          isPrivate,
          isDefault: researchRef.isDefault,
          attributes: researchRef.attributes,
          researchRef: {
            ...researchRef,
            expressLicenses,
            grantedAccess
          }
        };
      })
      .filter(r => filter.isDefault === undefined || filter.isDefault === r.isDefault)
      .filter(r => !filter.searchTerm || (r.researchRef && r.researchRef.attributes.some(rAttr => {
        
        const attribute = researchAttributes.find(attr => attr._id.toString() === rAttr.attributeId.toString());
        if (!attribute || !rAttr.value)
          return false;
        
        if (rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString() || rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.DESCRIPTION.toString()) {
          return `${rAttr.value}`.toLowerCase().includes(filter.searchTerm.toLowerCase());
        }

        // if (attribute.type == ATTRIBUTE_TYPE.RESEARCH_GROUP) {
        //   return r.research_group.name.toLowerCase().includes(filter.searchTerm.toLowerCase());
        // }

        if (attribute.type == ATTRIBUTE_TYPE.USER) {
          return r.members.some(m => m.toLowerCase().includes(filter.searchTerm.toLowerCase()));
        }
 
        return false;
      })))
      .filter(r => !filter.tenantIds.length || (r.researchRef && filter.tenantIds.some(tenantId => {
        return r.researchRef.tenantId == tenantId;
      })))
      .filter(r => !filter.researchAttributes.length || (r.researchRef && filter.researchAttributes.every(fAttr => {

        const attribute = researchAttributes.find(attr => attr._id.toString() === fAttr.attributeId.toString());
        if (!attribute) {
          return false;
        }

        const rAttr = r.researchRef.attributes.find(rAttr => rAttr.attributeId.toString() === fAttr.attributeId.toString());
        return fAttr.values.some((v) => {

          if (!rAttr || !rAttr.value) {
            return !v || v === 'false';
          }

          if (attribute.type == ATTRIBUTE_TYPE.EXPRESS_LICENSING) {
            if (v == true || v === 'true') {
              return rAttr.value.length != 0;
            } else {
              return true;
            }
          }

          if (Array.isArray(rAttr.value)) {
            return rAttr.value.some(rAttrV => rAttrV.toString() === v.toString());
          }

          if (typeof rAttr.value === 'string') {
            return rAttr.value.includes(v.toString());
          }

          return rAttr.value.toString() === v.toString();
        });

      })))
      .sort((a, b) => b.researchRef.created_at - a.researchRef.created_at);
  }


  async getResearch(researchExternalId) {
    const research = await this.findOne({ _id: researchExternalId, status: RESEARCH_STATUS.APPROVED });
    if (!research) return null;
    const results = await this.mapResearch([research]);
    const [result] = results;
    return result;
  }


  async getResearches(researchesExternalIds, statuses = [ RESEARCH_STATUS.APPROVED ]) {
    const researches = await this.findMany({ _id: { $in: [...researchesExternalIds] }, status: { $in: [...statuses] } });
    if (!researches.length) return [];
    const result = await this.mapResearch(researches);
    return result;
  }


  async lookupProjects(filter) {
    const researches = await this.findMany({ status: RESEARCH_STATUS.APPROVED });
    if (!researches.length) return [];
    const result = await this.mapResearch(researches, { ...filter, isDefault: false });
    return result;
  }


  async getProjectsByTeam(researchGroupExternalId) {
    const researches = await this.findMany({ researchGroupExternalId: researchGroupExternalId, status: RESEARCH_STATUS.APPROVED });
    if (!researches.length) return [];
    const result = await this.mapResearch(researches, { isDefault: false });
    return result;
  }


  async getProjectsByTenant(tenantId) {
    const available = await this.findMany({ status: RESEARCH_STATUS.APPROVED });
    const researches = available.filter(r => r.tenantId == tenantId);
    if (!researches.length) return [];
    const result = await this.mapResearch(researches, { isDefault: false });
    return result;
  }


  async getProjectsForMember(member) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const teamsRefs = await chainApi.getTeamReferencesAsync([member], false);
    const [teamsIds] = teamsRefs.map((g) => g.map(m => m.team));
    const chainResearches = await Promise.all(teamsIds.map(teamId => chainApi.getProjectsByTeamAsync(teamId)));
    const chainProjects = chainResearches.reduce((acc, projectsList) => {
      const projects = projectsList.filter(p => !acc.some(project => project.external_id == p.external_id));
      return [...acc, ...projects];
    }, []);
    const projects = await this.findMany({ _id: { $in: [...chainProjects.map(p => p.external_id)] }, status: RESEARCH_STATUS.APPROVED });
    if (!projects.length) return [];
    const result = await this.mapResearch(projects, { isDefault: false });
    return result;
  }


  async getProject(projectId) {
    const result = this.getResearch(projectId);
    return result;
  }

  
  async getProjects(projectsIds) {
    const result = this.getResearches(projectsIds);
    return result;
  }

  async getDefaultProject(accountId) {
    const project = await this.findOne({ isDefault: true, researchGroupExternalId: accountId });
    if (!project) return null;
    const results = await this.mapResearch([project], { isDefault: true });
    const [result] = results;
    return result;
  }

}

export default ProjectDtoService;