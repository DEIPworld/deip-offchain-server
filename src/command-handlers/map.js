import { APP_CMD } from '@casimir.one/platform-core';
import {
  proposalCmdHandler,
  accountCmdHandler,
  attributeCmdHandler,
  assetCmdHandler,
  documentTemplateCmdHandler,
  portalCmdHandler,
  layoutCmdHandler,
} from './index';


module.exports = {
  [APP_CMD.UPDATE_NFT_COLLECTION_METADATA]: assetCmdHandler,
  [APP_CMD.ADD_DAO_MEMBER]: accountCmdHandler,
  [APP_CMD.REMOVE_DAO_MEMBER]: accountCmdHandler,
  [APP_CMD.CREATE_DAO]: accountCmdHandler,
  [APP_CMD.UPDATE_DAO]: accountCmdHandler,
  [APP_CMD.IMPORT_DAO]: accountCmdHandler,
  [APP_CMD.ALTER_DAO_AUTHORITY]: accountCmdHandler,
  [APP_CMD.CREATE_PROPOSAL]: proposalCmdHandler,
  [APP_CMD.ACCEPT_PROPOSAL]: proposalCmdHandler,
  [APP_CMD.DECLINE_PROPOSAL]: proposalCmdHandler,
  [APP_CMD.CREATE_ATTRIBUTE]: attributeCmdHandler,
  [APP_CMD.UPDATE_ATTRIBUTE]: attributeCmdHandler,
  [APP_CMD.DELETE_ATTRIBUTE]: attributeCmdHandler,
  [APP_CMD.TRANSFER_FT]: assetCmdHandler,
  [APP_CMD.TRANSFER_NFT]: assetCmdHandler,
  [APP_CMD.CREATE_FT]: assetCmdHandler,
  [APP_CMD.CREATE_NFT_COLLECTION]: assetCmdHandler,
  [APP_CMD.CREATE_NFT_COLLECTION_METADATA]: assetCmdHandler,
  [APP_CMD.ISSUE_FT]: assetCmdHandler,
  [APP_CMD.CREATE_NFT_ITEM]: assetCmdHandler,
  [APP_CMD.CREATE_DOCUMENT_TEMPLATE]: documentTemplateCmdHandler,
  [APP_CMD.UPDATE_DOCUMENT_TEMPLATE]: documentTemplateCmdHandler,
  [APP_CMD.DELETE_DOCUMENT_TEMPLATE]: documentTemplateCmdHandler,
  [APP_CMD.CREATE_NFT_ITEM_METADATA_DRAFT]: assetCmdHandler,
  [APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT]: assetCmdHandler,
  [APP_CMD.DELETE_NFT_ITEM_METADATA_DRAFT]: assetCmdHandler,
  [APP_CMD.CREATE_NFT_ITEM_METADATA]: assetCmdHandler,
  [APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_STATUS]: assetCmdHandler,
  [APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_MODERATION_MSG]: assetCmdHandler,
  [APP_CMD.UPDATE_PORTAL_PROFILE]: portalCmdHandler,
  [APP_CMD.UPDATE_PORTAL_SETTINGS]: portalCmdHandler,
  [APP_CMD.UPDATE_LAYOUT_SETTINGS]: portalCmdHandler,
  [APP_CMD.UPDATE_ATTRIBUTE_SETTINGS]: portalCmdHandler,
  [APP_CMD.UPDATE_NETWORK_SETTINGS]: portalCmdHandler,
  [APP_CMD.CREATE_LAYOUT]: layoutCmdHandler,
  [APP_CMD.UPDATE_LAYOUT]: layoutCmdHandler,
  [APP_CMD.DELETE_LAYOUT]: layoutCmdHandler
};