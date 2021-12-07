import BaseService from './../../base/BaseService';
import ReviewSchema from './../../../schemas/ReviewSchema';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';

class ReviewDtoService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ReviewSchema, options);
  }

  async mapReviews(reviews) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainReviews = await Promise.all(reviews.map((review) => chainRpc.getReviewAsync(review._id)));

    return reviews.map((review) => {
      const chainReview = chainReviews.find((chainReview) => !!chainReview && chainReview.reviewId == review._id);
      
      let isPositive = undefined;
      let domains = [];
      let eciMap = {};
      let assessment = { type: 0, model: { scores: [] } };
      if (chainReview) {
        isPositive = chainReview.isPositive;
        domains = chainReview.domains;
        eciMap = chainReview.eciMap;
        chainReview = assessment;
      } else {
        console.warn(`Review with ID '${review._id}' is not found in the Chain`);
      }

      return {
        _id: review._id,
        tenantId: review.tenantId,
        projectId: review.researchExternalId,
        projectContentId: review.researchContentExternalId,
        author: review.author,
        content: review.content,
        domains: domains,
        eciMap: eciMap,
        assessment: assessment,
        createdAt: review.createdAt || review.created_at,
        updatedAt: review.updatedAt || review.updated_at,


        // @deprecated
        external_id: review._id,
        research_content_external_id: review.researchContentExternalId,
        is_positive: isPositive,
        reviewRef: review,
        created_at: review.createdAt || review.created_at,
        disciplines: domains.map((domainId) => {
          return {
            external_id: domainId,
            name: domainId
          }
        }),
        expertise_tokens_amount_by_discipline: eciMap,
        assessment_model_v: assessment.type,
        scores: assessment.model.scores
      };
    });
  }

  async getReview(id) {
    const review = await this.findOne({ _id: id });
    if (!review) return null;
    const results = await this.mapReviews([review]);
    const [result] = results;
    return result;
  }

  async getReviewsByProject(projectId) {
    const reviews = await this.findMany({ researchExternalId: projectId });
    if (!reviews.length) return [];
    const result = await this.mapReviews(reviews);
    return result;
  }

  async getReviewsByProjectContent(projectContentId) {
    const reviews = await this.findMany({ researchContentExternalId: projectContentId })
    if (!reviews.length) return [];
    const result = await this.mapReviews(reviews);
    return result;
  }

  async getReviewsByAuthor(author) {
    const reviews = await this.findMany({ author: author });
    if (!reviews.length) return [];
    const result = await this.mapReviews(reviews);
    return result;
  }  

  async getReviewUpvotes(reviewId) {
    const review = await this.getReview(reviewId);
    if (!review) return [];
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const result = await chainRpc.getReviewVotesByReviewIdAsync(review.id)
    return result;
  }
}

export default ReviewDtoService;