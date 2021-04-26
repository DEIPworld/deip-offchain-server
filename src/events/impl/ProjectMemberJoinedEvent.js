import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from './../../constants';


class ProjectMemberJoinedEvent extends BaseEvent {

  constructor(eventPayload) {
    super(APP_EVENT.PROJECT_MEMBER_JOINED, eventPayload);
  }

}


module.exports = ProjectMemberJoinedEvent;