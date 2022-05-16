
import { APP_EVENT, CONTRACT_AGREEMENT_STATUS, PROJECT_CONTENT_FORMAT } from '@deip/constants';
import mongoose from 'mongoose';
import cloneArchive from '../../../dar/cloneArchive';
import writeArchive from '../../../dar/writeArchive';
import { ContractAgreementDtoService, DraftService, PortalService } from '../../../services';
import FileStorage from '../../../storage';
import { generatePdf } from '../../../utils/pdf';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';

const getContractFilePath = async (filename) => {
  const contractAgreementDir = FileStorage.getContractAgreementDirPath();
  const isDirExists = await FileStorage.exists(contractAgreementDir);

  if (isDirExists) {
    const filePath = FileStorage.getContractAgreementFilePath(filename);
    const fileExists = await FileStorage.exists(filePath);

    if (fileExists) {
      await FileStorage.delete(filePath);
    }
  } else {
    await FileStorage.mkdir(contractAgreementDir);
  }

  return FileStorage.getContractAgreementFilePath(filename);
};

const saveContractPdf = async (content, filename) => {
  const filePath = await getContractFilePath(filename);
  const pdfBuffer = await generatePdf(content);

  await FileStorage.put(filePath, pdfBuffer);
};

class FileUploadEventHandler extends PortalAppEventHandler {
  constructor() {
    super();
  }
}

const fileUploadEventHandler = new FileUploadEventHandler();
const contractAgreementDtoService = new ContractAgreementDtoService();
const portalService = new PortalService();
const draftService = new DraftService();

fileUploadEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_CREATED, async (event) => {
  const {
    terms,
    pdfContent
  } = event.getEventPayload();

  if (pdfContent && terms.filename) {
    await saveContractPdf(pdfContent, terms.filename);
  }
});

fileUploadEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_CREATED, async (event) => {
  const {
    entityId: contractAgreementId,
    terms,
    pdfContent
  } = event.getEventPayload();

  if (pdfContent && terms.filename) {
    const contractAgreement = await contractAgreementDtoService.getContractAgreement(contractAgreementId);
    if (!contractAgreement || contractAgreement.status !== CONTRACT_AGREEMENT_STATUS.PROPOSED) {
      await saveContractPdf(pdfContent, terms.filename);
    }
  }
});

fileUploadEventHandler.register(APP_EVENT.PORTAL_SETTINGS_UPDATED, async (event) => {
  const { banner, logo, portalId } = event.getEventPayload();

  const portal = await portalService.getPortal(portalId);
  const oldBanner = portal.banner;
  const oldLogo = portal.logo;

  if (banner && oldBanner != banner) {
    const oldFilepath = FileStorage.getPortalBannerFilePath(portalId, oldBanner);
    const exists = await FileStorage.exists(oldFilepath);
    if (exists) {
      await FileStorage.delete(oldFilepath);
    }
  }

  if (logo && oldLogo != logo) {
    const oldFilepath = FileStorage.getPortalLogoFilePath(portalId, oldLogo);
    const exists = await FileStorage.exists(oldFilepath);
    if (exists) {
      await FileStorage.delete(oldFilepath);
    }
  }
});

fileUploadEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_CREATED, async (event) => {

  const { projectId, draftId, formatType, ctx } = event.getEventPayload();

  if (formatType === PROJECT_CONTENT_FORMAT.DAR || formatType === PROJECT_CONTENT_FORMAT.PACKAGE) {
    const _id = mongoose.Types.ObjectId(draftId);

    if (formatType == PROJECT_CONTENT_FORMAT.DAR) {
      const darPath = FileStorage.getProjectDarArchiveDirPath(projectId, _id);
      const blankDarPath = FileStorage.getProjectBlankDarArchiveDirPath();

      await cloneArchive(blankDarPath, darPath, true);
    }
    const files = ctx.req.files;
    if (formatType == PROJECT_CONTENT_FORMAT.PACKAGE && files.length > 0) {
      const tempDestinationPath = files[0].destination;

      const projectContentPackageDirPath = FileStorage.getProjectContentPackageDirPath(projectId, _id);

      await FileStorage.rename(tempDestinationPath, projectContentPackageDirPath);
    }
  }
});

fileUploadEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_UPDATED, async (event) => {

  const { _id: draftId, xmlDraft, uploadedFiles } = event.getEventPayload();

  const draft = await draftService.getDraft(draftId);

  if (draft.formatType === PROJECT_CONTENT_FORMAT.DAR) {
    const opts = {}
    const archiveDir = FileStorage.getProjectDarArchiveDirPath(draft.projectId, draft.folder);
    const version = await writeArchive(archiveDir, xmlDraft, {
      versioning: opts.versioning
    })
  }
  if (draft.formatType === PROJECT_CONTENT_FORMAT.PACKAGE) {
    const filesPathToDelete = draft.packageFiles
      .filter(({ filename }) => !uploadedFiles.some(({ originalname }) => originalname === filename))
      .map(({ filename }) => FileStorage.getProjectContentPackageFilePath(draft.projectId, draft.folder, filename));

    await Promise.all(filesPathToDelete.map(filePath => FileStorage.delete(filePath)));
  }
});

fileUploadEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_DELETED, async (event) => {
  const { draftId } = event.getEventPayload();

  const draft = await draftService.getDraft(draftId)

  if (draft.type === PROJECT_CONTENT_FORMAT.DAR) {
    const darPath = FileStorage.getProjectDarArchiveDirPath(draft.projectId, draft.folder);
    await FileStorage.rmdir(darPath);
  } else if (draft.type === PROJECT_CONTENT_FORMAT.PACKAGE) {
    const packagePath = FileStorage.getProjectContentPackageDirPath(draft.projectId, draft.hash);
    await FileStorage.rmdir(packagePath);
  }
});

export default fileUploadEventHandler;