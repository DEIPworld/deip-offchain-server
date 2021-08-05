import deipRpc from '@deip/rpc-client';
import qs from 'qs';
import ExpertiseService from './../../services/legacy/expertise';
import { UserDtoService } from './../../services';
import config from './../../config';
import { ChainService } from '@deip/chain-service';

const expertiseService = new ExpertiseService();

const getAccountEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const username = ctx.params.username;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const records = await chainApi.getAccountEciHistoryAsync(
      username,
      0, // cursor
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = records;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getAccountEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const username = ctx.params.username;

  try {
    const userDtoService = new UserDtoService();
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const stat = await chainApi.getAccountEciStatsAsync(
      username,
      filter.discipline || undefined, 
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const user = await userDtoService.getUser(username);
    const result = { user, ...stat };

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getAccountsEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {
    const userDtoService = new UserDtoService();
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const stats = await chainApi.getAccountsEciStatsAsync(
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const users = await Promise.all(stats.map(([name, stat]) => userDtoService.getUser(stat.account)));

    const result = stats.map(([name, stat], i) => {
      const user = users[i];
      return { user, ...stat };
    });

    result.sort((a, b) => b.eci - a.eci);

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchExternalId = ctx.params.research;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const records = await chainApi.getProjectEciHistoryAsync(
      researchExternalId,
      0, // cursor
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = records;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchExternalId = ctx.params.research;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const stat = await chainApi.getProjectEciStatsAsync(
      researchExternalId,
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = { ...stat };

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchesEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const stats = await chainApi.getProjectsEciStatsAsync(
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = stats;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchContentEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchContentExternalId = ctx.params.researchContent;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const records = await chainApi.getProjectContentEciHistoryAsync(
      researchContentExternalId,
      0, // cursor
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = records;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchContentEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchContentExternalId = ctx.params.researchContent;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const stat = await chainApi.getProjectContentEciStatsAsync(
      researchContentExternalId,
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = { ...stat };

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchContentsEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const stats = await chainApi.getProjectContentsEciStatsAsync(
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = stats;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDisciplineEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const result = await chainApi.getDisciplineEciHistoryAsync(
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDisciplinesEciStatsHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const result = await chainApi.getDisciplinesEciStatsHistoryAsync(
      filter.from || undefined,
      filter.to || undefined,
      filter.step || undefined
    );

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDisciplinesEciLastStats = async (ctx) => {
  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const result = await chainApi.getDisciplinesEciLastStatsAsync();
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getAccountExpertiseTokens = async (ctx) => {
  const username = ctx.params.username;
  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const result = await chainApi.getExpertTokensByAccountNameAsync(username);
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDisciplineExpertiseTokens = async (ctx) => {
  const disciplineExternalId = ctx.params.disciplineExternalId;
  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const result = await chainApi.getExpertTokensByDisciplineAsync(disciplineExternalId);
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getEciHistoryByResearchContentAndDiscipline = async (ctx) => {
  const { contentId, disciplineId } = ctx.params;
  try {
    const history = await expertiseService.getEciHistoryByResearchContentAndDiscipline(contentId, disciplineId);
    if (!history) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = history;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getExpertiseContributionsByResearch = async (ctx) => {
  const researchId = ctx.params.researchId;
  try {
    const expertise = await expertiseService.getExpertiseContributionsByResearch(researchId);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getExpertiseContributionsByResearchAndDiscipline = async (ctx) => {
  const { researchId, disciplineId } = ctx.params;
  try {
    const expertise = await expertiseService.getExpertiseContributionsByResearchAndDiscipline(researchId, disciplineId);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getExpertiseContributionByResearchContentAndDiscipline = async (ctx) => {
  const { contentId, disciplineId } = ctx.params;
  try {
    const expertise = await expertiseService.getExpertiseContributionByResearchContentAndDiscipline(contentId, disciplineId);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getExpertiseContributionsByResearchContent = async (ctx) => {
  const contentId = ctx.params.contentId;
  try {
    const expertise = await expertiseService.getExpertiseContributionsByResearchContent(contentId);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}



export default {

  getAccountEciHistory,
  getAccountEciStats,
  getAccountsEciStats,

  getResearchEciHistory,
  getResearchEciStats,
  getResearchesEciStats,

  getResearchContentEciHistory,
  getResearchContentEciStats,
  getResearchContentsEciStats,

  getDisciplineEciHistory,
  getDisciplinesEciStatsHistory,
  getDisciplinesEciLastStats,

  getAccountExpertiseTokens,
  getDisciplineExpertiseTokens,
  getEciHistoryByResearchContentAndDiscipline,
  getExpertiseContributionsByResearch,
  getExpertiseContributionsByResearchAndDiscipline,
  getExpertiseContributionByResearchContentAndDiscipline,
  getExpertiseContributionsByResearchContent
}