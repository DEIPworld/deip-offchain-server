import TenantProfile from './../schemas/tenant';

async function findTenantProfile(id) {
  const tenant = await TenantProfile.findOne({ _id: id });
  return tenant;
}

async function createTenantProfile({
  tenantId,
  name,
  shortName,
  description,
  email,
  logo,
  banner,
  admins
}, {
  signUpPolicy,
  researchAreas,
  researchComponents,
  faq,
  researchesBlacklist,
  researchesWhitelist
}) {

  const tenantProfile = new TenantProfile({
    _id: tenantId,
    name: name,
    shortName: shortName,
    description: description,
    email: email,
    logo: logo,
    banner: banner,
    admins: admins,
    settings: {
      signUpPolicy,
      researchAreas,
      researchComponents,
      faq,
      researchesBlacklist,
      researchesWhitelist
    }
  });

  return tenantProfile.save();
}

async function updateTenantProfile(tenantId, {
  name,
  shortName,
  description,
  email,
  logo,
  banner
}, {
  researchAreas,
  researchComponents,
  faq,
  researchesBlacklist,
  researchesWhitelist
}) {

  let tenantProfile = await findTenantProfile(tenantId);

  if (!tenantProfile) {
    throw new Error(`User profile ${us} does not exist`);
  }

  tenantProfile.name = name;
  tenantProfile.shortName = shortName;
  tenantProfile.description = description;
  tenantProfile.email = email;
  tenantProfile.logo = logo;
  tenantProfile.banner = banner;
  tenantProfile.settings.researchAreas = researchAreas;
  tenantProfile.settings.researchComponents = researchComponents;
  tenantProfile.settings.faq = faq;
  tenantProfile.settings.researchesBlacklist = researchesBlacklist;
  tenantProfile.settings.researchesWhitelist = researchesWhitelist;

  return tenantProfile.save();
}


export default {
  findTenantProfile,
  createTenantProfile,
  updateTenantProfile
}