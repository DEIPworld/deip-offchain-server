import TenantService from './../../../services/legacy/tenant';
import { AttributeDtoService } from './../../../services';

const tenantService = new TenantService();
const attributeDtoService = new AttributeDtoService();


function attributeFileProxy(options = {}) {
  return async function (ctx, next) {
    const currentTenant = ctx.state.tenant;
    const attributeId = ctx.params.attributeId;

    const attribute = await attributeDtoService.getAttribute(attributeId);
    ctx.assert(!!attribute, 404);

    if (attribute.tenantId == currentTenant.id) {
      await next();
    } else {
      const requestedTenant = await tenantService.getTenant(attribute.tenantId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different tenant's server */
        ctx.status = 307;
        ctx.redirect(`${requestedTenant.profile.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = attributeFileProxy;