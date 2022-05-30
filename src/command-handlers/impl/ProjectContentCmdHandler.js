import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import {
  ProjectContentDraftCreatedEvent,
  ProjectContentDraftDeletedEvent,
  ProjectContentDraftUpdatedEvent,
  ProjectContentCreatedEvent,
  ProjectContentDraftStatusUpdatedEvent,
  ProjectContentDraftModerationMessageUpdatedEvent,
} from './../../events';

class ProjectContentCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const projectContentCmdHandler = new ProjectContentCmdHandler();

projectContentCmdHandler.register(APP_CMD.CREATE_DRAFT, (cmd, ctx) => {

  const draftData = cmd.getCmdPayload();
  //TODO: clarify flow for portal without project-contents-draft moderation
  // const moderationRequired = !!ctx.state.portal.profile.settings.moderation?.projectContentDraftModerationRequired
  ctx.state.appEvents.push(new ProjectContentDraftCreatedEvent({
    ...draftData,
    uploadedFiles: ctx.req.files,
  }));
});

projectContentCmdHandler.register(APP_CMD.UPDATE_DRAFT, (cmd, ctx) => {

  const draftData = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectContentDraftUpdatedEvent({ ...draftData, uploadedFiles: ctx.req.files }));
});

projectContentCmdHandler.register(APP_CMD.UPDATE_DRAFT_STATUS, (cmd, ctx) => {

  const { _id, status } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectContentDraftStatusUpdatedEvent({ _id, status }));
});

projectContentCmdHandler.register(APP_CMD.UPDATE_DRAFT_MODERATION_MESSAGE, (cmd, ctx) => {

  const { _id, moderationMessage } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectContentDraftModerationMessageUpdatedEvent({ _id, moderationMessage }));
});


projectContentCmdHandler.register(APP_CMD.DELETE_DRAFT, (cmd, ctx) => {

  const { draftId } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectContentDraftDeletedEvent({ draftId }));
});

projectContentCmdHandler.register(APP_CMD.CREATE_PROJECT_CONTENT, (cmd, ctx) => {

  const projectContent = cmd.getCmdPayload();
  ctx.state.appEvents.push(new ProjectContentCreatedEvent({
    ...projectContent,
    creator: ctx.state.user.username,
  }));
});



module.exports = projectContentCmdHandler;