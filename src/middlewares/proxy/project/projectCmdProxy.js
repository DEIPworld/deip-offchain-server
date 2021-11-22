import { ProjectDtoService, PortalService } from './../../../services';

const portalService = new PortalService();
const projectDtoService = new ProjectDtoService();


function projectCmdProxy(options = {}) {
  return async function (ctx, next) {
    const currentTenant = ctx.state.tenant;
    const projectId = ctx.request.header['entity-id'];

    const project = await projectDtoService.getProject(projectId);
    if (ctx.req.method === "PUT") {
      ctx.assert(!!project, 404);
    }

    if (ctx.req.method === "POST" || (ctx.req.method === "PUT" && project.tenantId == currentTenant.id)) {
      await next();
    } else {
      const requestedTenant = await portalService.getPortal(project.tenantId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different tenant's server */
        ctx.status = 307;
        ctx.redirect(`${requestedTenant.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = projectCmdProxy;