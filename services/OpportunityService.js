const models = require("../models/index");
const clog = require("./ChalkService");
const {SaveEventService} = require("./events.service");
const CommonService = require("./CommonService");
const {Op, Sequelize} = require("sequelize");
const {RECOMMENDED_OPPORTUNITY} = require("../config/events.config");
exports.PostOpportunityValidation = async (data) => {
  // all the field are required===============>
  try {
    const {
      opportunityName,
      description,
      recruitmentStartDate,
      recruitmentEndDate,
      projectStartDate,
      projectEndDate,
      engagementType,
      emergency,
      skills,
      interest,
      location,
    } = data;

    if (
      !opportunityName ||
      !description ||
      !recruitmentStartDate ||
      !recruitmentEndDate ||
      !projectStartDate ||
      !projectEndDate ||
      !engagementType ||
      emergency === undefined ||
      skills?.length === 0 ||
      interest?.length === 0 ||
      location?.length === 0
    ) {
      return {
        status: 0,
        message: "All fields are required!",
      };
    }

    return {
      status: 1,
      message: "success",
    };
  } catch (error) {
    return {
      status: 1,
      message: error.message,
      data: {},
    };
  }
};

// check validation for dates====================+>
exports.OpportunityDateValidation = async (data) => {
  try {
    const {
      recruitmentStartDate,
      recruitmentEndDate,
      projectStartDate,
      projectEndDate,
    } = data;

    if (
      new Date(recruitmentStartDate) > new Date(recruitmentEndDate) ||
      new Date(projectStartDate) > new Date(projectEndDate)
    ) {
      return {
        status: 0,
        message: "Start dates cannot be after end dates.",
      };
    }

    if (new Date(recruitmentEndDate) > new Date(projectStartDate)) {
      return {
        status: 0,
        message: "Recruitment period should end before the project starts.",
      };
    }

    return {
      status: 1,
      message: "Date validation successful.",
    };
  } catch (error) {
    return {
      status: 1,
      message: error.message,
      data: {},
    };
  }
};

exports.fetchTheRecommendedOpportunity = async (id, userSkills) => {
  try {
    let getTodaysDate = CommonService.generateTodaysDate();
    const getAllAppliedOpportunity = await models.opportunities_applies.findAll(
      {where: {userId: id}}
    );
    let appliedOpportunityIds = getAllAppliedOpportunity.map(
      (opp) => opp.opportunity_id
    );
    // Order by the presence of user skills (descending order)
    const OrderQuery = [["createdAt", "DESC"]];
    const RecommendationOrderSql = `(SELECT COUNT(*) FROM opportunities_skills_interest_locations AS os LEFT JOIN masterDropdowns AS s ON os.reference_id = s.id WHERE os.opportunity_id = opportunities.id AND s.name IN(${userSkills.toString()}))`;
    if (userSkills.length) {
      OrderQuery.unshift([Sequelize.literal(RecommendationOrderSql), "DESC"]);
    }
    let QueryOptions = {
      include: [
        {
          association: "opportunitySkill",
          attributes: ["id", "type", "reference_id"],
          required: false,
          where: {
            deleted: 0,
          },
          include: [
            {
              attributes: ["id", "name", "type"],
              required: false,
              association: "skill",
              where: {
                deleted: 0,
              },
            },
          ],
        },
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "profilePicture"],
          // required: true, // Make user association required
          where: {
            deleted: 0,
          },
        },
      ],
      where: {
        deleted: 0,
        id: {
          [Op.notIn]: appliedOpportunityIds,
        },
        recruit_start: {
          [Op.lte]: `${getTodaysDate}`,
        },
        recruit_end: {
          [Op.gte]: `${getTodaysDate}`,
        },
      },
      order: OrderQuery,
      limit: 15,
    };
    let RecommOpps = await models.opportunities.findAll(QueryOptions);
    // Send Response
    if (RecommOpps.length > 0) {
      return {
        status: 1,
        count: RecommOpps.length,
        data: RecommOpps,
      };
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}
exports.getRecommendedOppByUserId = async (userId) => {
  try {
    if (!userId) {
      return false;
    }
    // get the todays date=================>
    let getTodaysDate = CommonService.generateTodaysDate();

  

    // getAllOpportuntities for which user applied===========>
    const getAllAppliedOpportunity = await models.opportunities_applies.findAll(
      {where: {userId}}
    );
    let appliedOpportunityIds = getAllAppliedOpportunity.map((opp) => opp.opportunity_id);
    // Order by the presence of user skills (descending order)
    // Skills and Interest Recommendation Query
    let SkillIntRecomSql = `(SELECT opportunity_id FROM opportunities_skills_interest_locations WHERE type IN ('interest', 'skill') and reference_id IN (SELECT reference_id FROM user_skills_or_interests WHERE userId=${userId} AND deleted = 0 and type IN ('interest', 'skill')))`;
    // Location Filter to Recommendation
    let LocRecommSql = `(SELECT opportunity_id FROM opportunities_skills_interest_locations WHERE type = 'location' and (reference_id IN (SELECT reference_id FROM user_skills_or_interests WHERE userId=${userId} AND deleted = 0 and type = 'location') OR reference_id = 7))`;
    // 7 reference Id is for global locations
    let QueryOptions = {
      where: {
        deleted: 0,
        userId: {
          [Op.ne]: userId
        },
        id: {
          [Op.and]: [
            {[Op.notIn]: appliedOpportunityIds},
            {[Op.in]: [Sequelize.literal(SkillIntRecomSql)]},
            {[Op.in]: [Sequelize.literal(LocRecommSql)]}
          ]
        },
        recruit_start: {
          [Op.lte]: getTodaysDate,
        },
        recruit_end: {
          [Op.gte]: getTodaysDate,
        },
      },
      order: [
        Sequelize.fn('RAND')
      ]
    };
    let RecommOpp = await models.opportunities.findOne(QueryOptions);
    // Send Response
    if (RecommOpp) {
      return RecommOpp;
    } else {
      return false;
    }
  } catch (error) {
    clog.error("Error While Finding Opportunity Recommendation", error);
    return false;
  }
};
// validate the applied applicants==========>
exports.checkTheAppliedApplicants = async (id) => {
  try {
    let options = {
      where: {
        deleted: 0,
        opportunity_id: id,
      }
    }
    const response = await models.opportunities_applies.findOne(options);
    if (response) {
      return {
        status: 0,
        message: "An employee has applied for this opportunity. Deletion is not possible."
      }
    }
    return {
      status: 1
    }
  } catch (error) {
    clog.error(error);
    return false;
  }
}


exports.checkLoggedUserOpportunity = async(id , response) => {
    if(id !== response.userId) {
      return {
        status : 0 ,
        message : "You are unable to delete the Opportunity"
      }
    }
    return {status : 1}
}