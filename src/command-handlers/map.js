import { APP_CMD } from '@deip/constants';
import { 
  projectCmdHandler, 
  proposalCmdHandler,
  accountCmdHandler,
  attributeCmdHandler,
  invstOppCmdHandler,
  assetCmdHandler,
  documentTemplateCmdHandler,
  projectContentCmdHandler,
  reviewCmdHandler,
  projectNdaCmdHandler,
  contractAgreementCmdHandler,
  portalCmdHandler
} from './index';


module.exports = {
  [APP_CMD.CREATE_PROJECT]: projectCmdHandler,
  [APP_CMD.UPDATE_PROJECT]: projectCmdHandler,
  [APP_CMD.DELETE_PROJECT]: projectCmdHandler,
  [APP_CMD.JOIN_TEAM]: accountCmdHandler,
  [APP_CMD.LEAVE_TEAM]: accountCmdHandler,
  [APP_CMD.CREATE_ACCOUNT]: accountCmdHandler,
  [APP_CMD.UPDATE_ACCOUNT]: accountCmdHandler,
  [APP_CMD.ALTER_ACCOUNT_AUTHORITY]: accountCmdHandler,
  [APP_CMD.CREATE_PROPOSAL]: proposalCmdHandler,
  [APP_CMD.UPDATE_PROPOSAL]: proposalCmdHandler,
  [APP_CMD.DECLINE_PROPOSAL]: proposalCmdHandler,
  [APP_CMD.CREATE_ATTRIBUTE]: attributeCmdHandler,
  [APP_CMD.UPDATE_ATTRIBUTE]: attributeCmdHandler,
  [APP_CMD.DELETE_ATTRIBUTE]: attributeCmdHandler,
  [APP_CMD.CREATE_INVESTMENT_OPPORTUNITY]: invstOppCmdHandler,
  [APP_CMD.INVEST]: invstOppCmdHandler,
  [APP_CMD.ASSET_TRANSFER]: assetCmdHandler,
  [APP_CMD.CREATE_ASSET]: assetCmdHandler,
  [APP_CMD.ISSUE_ASSET]: assetCmdHandler,
  [APP_CMD.CREATE_DOCUMENT_TEMPLATE]: documentTemplateCmdHandler,
  [APP_CMD.UPDATE_DOCUMENT_TEMPLATE]: documentTemplateCmdHandler,
  [APP_CMD.DELETE_DOCUMENT_TEMPLATE]: documentTemplateCmdHandler,
  [APP_CMD.CREATE_DRAFT]: projectContentCmdHandler,
  [APP_CMD.UPDATE_DRAFT]: projectContentCmdHandler,
  [APP_CMD.DELETE_DRAFT]: projectContentCmdHandler,
  [APP_CMD.CREATE_PROJECT_CONTENT]: projectContentCmdHandler,
  [APP_CMD.CREATE_REVIEW_REQUEST]: reviewCmdHandler,
  [APP_CMD.DECLINE_REVIEW_REQUEST]: reviewCmdHandler,
  [APP_CMD.CREATE_REVIEW]: reviewCmdHandler,
  [APP_CMD.UPVOTE_REVIEW]: reviewCmdHandler,
  [APP_CMD.CREATE_PROJECT_NDA]: projectNdaCmdHandler,
  [APP_CMD.CREATE_CONTRACT_AGREEMENT]: contractAgreementCmdHandler,
  [APP_CMD.ACCEPT_CONTRACT_AGREEMENT]: contractAgreementCmdHandler,
  [APP_CMD.REJECT_CONTRACT_AGREEMENT]: contractAgreementCmdHandler,
  [APP_CMD.UPDATE_PORTAL_PROFILE]: portalCmdHandler,
  [APP_CMD.UPDATE_PORTAL_SETTINGS]: portalCmdHandler,
  [APP_CMD.UPDATE_LAYOUT]: portalCmdHandler,
  [APP_CMD.UPDATE_LAYOUT_SETTINGS]: portalCmdHandler,
  [APP_CMD.UPDATE_ATTRIBUTE_SETTINGS]: portalCmdHandler,
  [APP_CMD.UPDATE_NETWORK_SETTINGS]: portalCmdHandler,
  [APP_CMD.DELETE_USER_PROFILE]: portalCmdHandler
};