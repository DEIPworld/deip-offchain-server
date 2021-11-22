import { TeamDtoService, PortalService } from './../../../services';

const portalService = new PortalService();
const teamDtoService = new TeamDtoService();


function teamCmdProxy(options = {}) {
  return async function (ctx, next) {
    const currentTenant = ctx.state.tenant;
    const teamId = ctx.request.header['entity-id'];

    const team = await teamDtoService.getTeam(teamId);
    if (ctx.req.method === "PUT") {
      ctx.assert(!!team, 404);
    }

    if (ctx.req.method === "POST" || (ctx.req.method === "PUT" && team.tenantId == currentTenant.id)) {
      await next();
    } else {
      const requestedTenant = await portalService.getPortal(team.tenantId);
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


module.exports = teamCmdProxy;