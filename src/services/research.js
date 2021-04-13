import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import Research from './../schemas/research';
import ExpressLicensingService from './expressLicensing'
import ResearchNdaService from './researchNda'
import UserService from './users'
import AttributesService from './attributes'

import mongoose from 'mongoose';
import { RESEARCH_ATTRIBUTE_TYPE, RESEARCH_ATTRIBUTE, RESEARCH_STATUS, ATTRIBUTE_SCOPE } from './../constants';

class ResearchService extends BaseReadModelService {

  constructor(options = { scoped: true }) { 
    super(Research, options);
  }

  async mapResearch(researches, filterObj) {
    const expressLicensingService = new ExpressLicensingService();
    const researchNdaService = new ResearchNdaService();
    const userService = new UserService();
    const attributesService = new AttributesService()

    const filter = {
      searchTerm: "",
      researchAttributes: [],
      tenantIds: [],
      ...filterObj
    }

    const chainResearches = await deipRpc.api.getResearchesAsync(researches.map(r => r._id));
    const researchesExpressLicenses = await expressLicensingService.getExpressLicensesByResearches(chainResearches.map(r => r.external_id));
    const chainResearchNdaList = await Promise.all(chainResearches.map(r => researchNdaService.getResearchNdaListByResearch(r.external_id)));
    const researchAttributes = await attributesService.getAttributesByScope(ATTRIBUTE_SCOPE.RESEARCH);
    
    return chainResearches
      .map((chainResearch) => {
        const researchRef = researches.find(r => r._id.toString() == chainResearch.external_id);
        const expressLicenses = researchesExpressLicenses.filter(l => l.researchExternalId == chainResearch.external_id);
        // TEMP
        const grantedAccess = chainResearchNdaList
          .reduce((acc, list) => { return [...acc, ...list] }, [])
          .filter((nda) => nda.research_external_id == chainResearch.external_id)
          .reduce((acc, nda) => {
            return [...acc, ...nda.parties];
          }, []);

        const attributes = researchRef ? researchRef.attributes : [];
       
        const title = attributes.some(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString())
          ? attributes.find(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString()).value.toString()
          : "Not Specified";

        const abstract = attributes.some(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.DESCRIPTION.toString())
          ? attributes.find(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.DESCRIPTION.toString()).value.toString()
          : "Not Specified";

        const isPrivate = attributes.some(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.IS_PRIVATE.toString())
          ? attributes.find(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.IS_PRIVATE.toString()).value.toString() === 'true'
          : false;

        return { ...chainResearch, tenantId: researchRef ? researchRef.tenantId : null, title, abstract, isPrivate, researchRef: researchRef ? { ...researchRef, expressLicenses, grantedAccess } : { attributes: [], expressLicenses: [], grantedAccess: [] } };
      })
      .filter(r => !filter.searchTerm || (r.researchRef && r.researchRef.attributes.some(rAttr => {
        
        const attribute = researchAttributes.find(attr => attr._id.toString() === rAttr.researchAttributeId.toString());
        if (!attribute || !rAttr.value)
          return false;
        
        if (rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString() || rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.DESCRIPTION.toString()) {
          return `${rAttr.value}`.toLowerCase().includes(filter.searchTerm.toLowerCase());
        }

        // if (attribute.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP) {
        //   return r.research_group.name.toLowerCase().includes(filter.searchTerm.toLowerCase());
        // }

        if (attribute.type == RESEARCH_ATTRIBUTE_TYPE.USER) {
          return r.members.some(m => m.toLowerCase().includes(filter.searchTerm.toLowerCase()));
        }
 
        return false;
      })))
      .filter(r => !filter.tenantIds.length || (r.researchRef && filter.tenantIds.some(tenantId => {
        return r.researchRef.tenantId == tenantId;
      })))
      .filter(r => !filter.researchAttributes.length || (r.researchRef && filter.researchAttributes.every(fAttr => {

        const attribute = researchAttributes.find(attr => attr._id.toString() === fAttr.researchAttributeId.toString());
        if (!attribute) {
          return false;
        }

        const rAttr = r.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() === fAttr.researchAttributeId.toString());
        return fAttr.values.some((v) => {

          if (!rAttr || !rAttr.value) {
            return !v || v === 'false';
          }

          if (attribute.type == RESEARCH_ATTRIBUTE_TYPE.EXPRESS_LICENSING) {
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


  async lookupResearches(filter) {
    const researches = await this.findMany({ status: RESEARCH_STATUS.APPROVED });
    if (!researches.length) return [];
    const result = await this.mapResearch(researches, filter);
    return result;
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


  async getResearchesByResearchGroup(researchGroupExternalId) {
    const researches = await this.findMany({ researchGroupExternalId: researchGroupExternalId, status: RESEARCH_STATUS.APPROVED });
    if (!researches.length) return [];
    const result = await this.mapResearch(researches);
    return result;
  }


  async getResearchesByTenant(tenantId) {
    const available = await this.findMany({ status: RESEARCH_STATUS.APPROVED });
    const researches = available.filter(r => r.tenantId == tenantId);
    if (!researches.length) return [];
    const result = await this.mapResearch(researches);
    return result;
  }


  async getResearchesForMember(member) {
    const chainResearches = await deipRpc.api.getResearchesByResearchGroupMemberAsync(member);
    const researches = await this.findMany({ _id: { $in: [...chainResearches.map(r => r.external_id)] }, status: RESEARCH_STATUS.APPROVED });
    if (!researches.length) return [];
    const result = await this.mapResearch(researches);
    return result;
  }

  
  async createResearchRef({
    externalId,
    researchGroupExternalId,
    attributes,
    status
  }) {

    const mappedAttributes = await this.mapAttributes(attributes);
    const result = await this.createOne({
      _id: externalId,
      researchGroupExternalId,
      status,
      attributes: mappedAttributes
    })

    return result;
  }
  

  async updateResearchRef(externalId, { status, attributes }) {

    let mappedAttributes;
    if (attributes) {
      mappedAttributes = await this.mapAttributes(attributes);
    }

    const result = this.updateOne({ _id: externalId }, {
      status,
      attributes: attributes ? mappedAttributes : undefined
    });

    return result;
  }


  async mapAttributes(attributes) {
    const attributesService = new AttributesService()
    const researchAttributes = await attributesService.getAttributesByScope(ATTRIBUTE_SCOPE.RESEARCH);

    return attributes.map(rAttr => {
      const rAttrId = mongoose.Types.ObjectId(rAttr.researchAttributeId.toString());

      const attribute = researchAttributes.find(a => a._id.toString() == rAttrId);
      let rAttrValue = null;

      if (!attribute) {
        console.warn(`${rAttrId} is obsolete attribute`);
      }

      if (!attribute || rAttr.value == null) {
        return {
          researchAttributeId: rAttrId,
          value: rAttrValue
        };
      }

      switch (attribute.type) {
        case RESEARCH_ATTRIBUTE_TYPE.STEPPER: {
          rAttrValue = mongoose.Types.ObjectId(rAttr.value.toString()); // _id
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.TEXT: {
          rAttrValue = rAttr.value.toString(); // text
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.TEXTAREA: {
          rAttrValue = rAttr.value.toString(); // text
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.SELECT: {
          rAttrValue = rAttr.value.map(v => mongoose.Types.ObjectId(v.toString())); // _id
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.URL: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.VIDEO_URL: {
          rAttrValue = rAttr.value.toString(); // url
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.SWITCH: {
          rAttrValue = rAttr.value == true || rAttr.value === 'true';
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.CHECKBOX: {
          rAttrValue = rAttr.value == true || rAttr.value === 'true';
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.USER: {
          rAttrValue = rAttr.value.map(v => v.toString()); // username / external_id
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.DISCIPLINE: {
          rAttrValue = rAttr.value.map(v => v.toString()); // external_id
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP: {
          rAttrValue = rAttr.value.map(v => v.toString()); // external_id
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.IMAGE: {
          rAttrValue = rAttr.value.toString(); // image name
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.FILE: {
          rAttrValue = rAttr.value.toString(); // file name
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.EXPRESS_LICENSING: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.ROADMAP: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        case RESEARCH_ATTRIBUTE_TYPE.PARTNERS: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        default: {
          console.warn(`Unknown attribute type ${attribute.type}`);
          rAttrValue = rAttr.value;
          break;
        }
      }

      return {
        researchAttributeId: rAttrId,
        value: rAttrValue
      }
    })
  }


  async addAttributeToResearches({ researchAttributeId, type, defaultValue }) {
    const result = await this.updateMany({}, { $push: { attributes: { researchAttributeId: mongoose.Types.ObjectId(researchAttributeId), type, value: defaultValue } } });
    return result;
  }


  async removeAttributeFromResearches({ researchAttributeId }) {
    const result = await this.updateMany({}, { $pull: { attributes: { researchAttributeId: mongoose.Types.ObjectId(researchAttributeId) } } });
    return result;
  }


  async updateAttributeInResearches({ researchAttributeId, type, valueOptions, defaultValue }) {
    if (type == RESEARCH_ATTRIBUTE_TYPE.STEPPER || type == RESEARCH_ATTRIBUTE_TYPE.SELECT) {
      const result = await this.updateMany(
        {
          $and: [
            { 'attributes.researchAttributeId': mongoose.Types.ObjectId(researchAttributeId) },
            { 'attributes.value': { $nin: [...valueOptions.map(opt => mongoose.Types.ObjectId(opt.value))] } }
          ]
        },
        { $set: { 'attributes.$.value': defaultValue } }
      );

      return result;
    } else {
      return Promise.resolve();
    }
  }

}

export default ResearchService;