const models = require("../models/index");
const clog = require("../services/ChalkService");
const CommonService = require("../services/CommonService");
const OpportunityService = require("../services/OpportunityService");
const { Op, Sequelize, QueryTypes } = require("sequelize");
const { SaveEventService } = require("../services/events.service");
const { APPLY_OPPORTUNITY } = require("../config/events.config");
const { CREATED, DELETE } = require("../config/action.config");

exports.getMoreOpportunity = async (req, res) => {
  try {
    const query = req?.query;
    const user = req?.user;
    const { location, skill, urgency, commitment, interest, page } = query; // parameters for more opportunities
    let getTodayDate = CommonService.generateTodaysDate();

    // Association of Skills
    let SkillsAssociation = {
      association: "opportunitySkill",
      required: false,
      include: [
        {
          association: "skill",
          order: [["createdAt", "DESC"]], // Order skills by createdAt in descending order
        },
      ],
    };
    // Adding Association Filter Parameters if available
    let SkillType = [];
    let SkillsValue = [];
    if (location || interest || skill) {
      if (location) {
        SkillType.push("location");
        SkillsValue.push(location);
      }
      if (skill) {
        SkillType.push("skill");
        SkillsValue.push(skill);
      }
      if (interest) {
        SkillType.push("interest");
        SkillsValue.push(interest);
      }
      SkillsAssociation = {
        association: "opportunitySkill",
        required: false,
        attributes: ["id", "type", "reference_id"],
        include: [
          {
            association: "skill",
            order: [["createdAt", "DESC"]], // Order skills by createdAt in descending order
            attributes: ["id", "name", "type"],
          },
        ],
      };
    }
    let filterLocIntSkillQuery;
    if (SkillsValue.length) {
      let SkillAddonTofilter = "";
      if (location) {
        SkillAddonTofilter += `AND locationname.name = '${location}' `;
      }
      if (skill) {
        SkillAddonTofilter += `AND skillname.name = '${skill}' `;
      }
      if (interest) {
        SkillAddonTofilter += `AND interestname.name = '${interest}' `;
      }

      filterLocIntSkillQuery = `SELECT DISTINCT op.id FROM opportunities op JOIN opportunities_skills_interest_locations skill ON skill.opportunity_id = op.id AND skill.type = "skill" AND skill.deleted = 0 JOIN masterDropdowns skillname ON skillname.id = skill.reference_id JOIN opportunities_skills_interest_locations location ON location.opportunity_id = op.id AND location.type = "location" AND location.deleted = 0 JOIN masterDropdowns locationname ON locationname.id = location.reference_id JOIN opportunities_skills_interest_locations interest ON interest.opportunity_id = op.id AND interest.type = "interest" AND interest.deleted = 0 JOIN masterDropdowns interestname ON interestname.id = interest.reference_id WHERE op.deleted = 0 ${SkillAddonTofilter}`;
      const Filtered = await models.sequelize.query(filterLocIntSkillQuery, {
        type: QueryTypes.SELECT,
      });
      clog.warn(Filtered);
    }
    // getAllOpportuntities for which user applied===========>
    const getAllAppliedOpportunity = await models.opportunities_applies.findAll({ where: { userId: req?.user?.id } });
    let appliedOpportunityIds = getAllAppliedOpportunity.map((opp) => opp.opportunity_id);
    // Options for Data
    let options = {
      where: {
        deleted: 0,
        id: {
          [Op.notIn]: appliedOpportunityIds,
        },
        recruit_start: {
          [Op.lte]: `${getTodayDate}`,
        },
        recruit_end: {
          [Op.gte]: `${getTodayDate}`,
        },
      },
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "profilePicture"],
          required: true, // Make user association required
          where: {
            deleted: 0,
            id: {
              [Op.ne]: user.id,
            },
          },
        },
        SkillsAssociation,
      ],
      order: [
        ["createdAt", "DESC"], // Sort by createdAt in descending order
      ],
      distinct: true,
    };
    if (SkillsValue.length) {
      options.where.id = {
        ...options.where.id,
        [Op.in]: [Sequelize.literal(filterLocIntSkillQuery)],
      };
    }
    if (commitment) {
      options.where.commit_time = {
        [Op.or]: {
          [Op.lte]: +commitment,
          [Op.eq]: +commitment,
        },
      };
    }
    if (urgency) {
      options.where.emg_opportunity = +urgency;
    }
    // Handling Paginations
    let pageLimit = 5;
    let currentPage = Math.abs(page) || 1;
    options.limit = pageLimit;
    options.offset = (currentPage - 1) * pageLimit;
    // End Pagination
    const { rows, count } = await models.opportunities.findAndCountAll(options);
    if (rows) {
      let isMoreLeft = count - ((currentPage - 1) * pageLimit + rows.length) > 0;
      let nextPage = isMoreLeft ? +page + 1 : null;
      return res.send({
        status: 1,
        TotalDataLength: rows.length,
        currentPage: +page,
        nextPage: +page ? nextPage : 2,
        message: req.__("Fetch data successFully..."),
        data: rows,
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("opportunity is not present"),
      });
    }
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// Get Opportunity By its Id============>
exports.getOpportunityById = async (req, res) => {
  try {
    const id = req.params.id;
    const getUserId = req?.userId;
    const checkExist = CommonService.validateParamsId(id);
    if (!checkExist) {
      return res.json({
        status: 0,
        message: "Valid Opportunity ID is required.",
      });
    }
    let options = {
      where: {
        id: id,
        deleted: 0,
      },
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "email", "profilePicture"],
        },
        {
          association: "opportunitySkill",
          include: [
            {
              association: "skill",
              order: [["createdAt", "DESC"]], // Order skills by createdAt in descending order
            },
          ],
        },
        {
          association: "opportunitiesAppliedData",
          where: {
            userId: getUserId,
          },
          required: false,
        },
      ],
    };

    const result = await models.opportunities.findOne(options);

    if (result) {
      return res.send({
        status: 1,
        message: req.__("success"),
        data: result,
      });
    } else {
      return res.json({
        status: 0,
        message: req.__("No records found"),
        data: {},
      });
    }
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
};

// Create the new Opportunity
exports.postOpportunity = async (req, res) => {
  try {
    const data = req?.body;
    let getUserId = req?.user?.id;
    let options = { id: getUserId };
    // all the field are required validation============>
    const dataValidation = await OpportunityService.PostOpportunityValidation(data);
    //  check the recruit start is less than end date and project_start and project_end date
    const dateValidation = await OpportunityService.OpportunityDateValidation(data);
    if (!dataValidation.status || !dateValidation.status) {
      return res.send({
        status: 0,
        message: !dataValidation.status ? dataValidation.message : dateValidation.message,
      });
    }
    //  trim the opportunity Name upload in the database accordingly====>
    let oppName = await CommonService.trimResponse(data?.opportunityName);
    // upload the opportunity
    const createOpportunity = await models.opportunities.create({
      opportunity_name: oppName,
      userId: getUserId,
      opportunity_desc: data?.description,
      recruit_start: data?.recruitmentStartDate,
      recruit_end: data?.recruitmentEndDate,
      project_start: data?.projectStartDate,
      project_end: data?.projectEndDate,
      engagement_type: data?.engagementType,
      commit_time: data?.commitTime,
      emg_opportunity: data?.emergency ? 1 : 0,
      createdBy: getUserId,
    });

    if (createOpportunity) {
      // set their location===================>
      if (data?.location) {
        const setLocationResponseData = data?.location.map((location) => ({
          opportunity_id: createOpportunity.id,
          type: "location",
          createdBy: req?.user?.id,
          reference_id: location,
        }));

        const locationResponse = await models.opportunities_skills_interest_locations.bulkCreate(setLocationResponseData);
      }

      // set the skill if provided============>
      if (data?.skills) {
        const setSkillResponseData = data?.skills.map((skill) => ({
          opportunity_id: createOpportunity.id,
          type: "skill",
          createdBy: req?.user?.id,
          reference_id: skill,
        }));

        const skillResponse = await models.opportunities_skills_interest_locations.bulkCreate(setSkillResponseData, { returning: ["id"] });
      }

      // set the interest of the opportunities==============>
      if (data?.interests) {
        const setInterestResponseData = data?.interests.map((interest) => ({
          opportunity_id: createOpportunity.id,
          type: "interest",
          createdBy: req?.user?.id,
          reference_id: interest,
        }));

        const interestResponse = await models.opportunities_skills_interest_locations.bulkCreate(setInterestResponseData);
      }

      await CommonService.actionLogs("OPPORTUNITY", createOpportunity.id, CREATED, options, createOpportunity.id, req, res);
      return res.send({
        status: 1,
        message: "Opportunity added to WHOOp",
        data: createOpportunity,
      });
    } else {
      return res.send({
        status: 0,
        message: "something went wrong!!!",
      });
    }
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
};

// Opportunity  Applied User  LIst
exports.opportunityAppliedUser = async (req, res) => {
  try {
    let options = {
      where: {
        //   userId: req?.userId,
        opp_status: 0,
        deleted: 0,
      },
      include: [
        {
          association: "opportunityDetails",
          where: {
            userId: req?.userId,
            deleted: 0,
          },
          // attributes : ['id' , 'userId' ,'opportunity_id' , 'opp_status','opp_type'] ,
          //  include: [{ association: "user", attributes: ['id', 'firstName', 'lastName', 'email' , 'profilePicture'] }],
          order: [["createdAt", "DESC"]],
        },
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "email", "profilePicture"],
        },
      ],
    };
    //   fetch all the opportunities create by the user .
    const opportunityCreateByUser = await models.opportunities_applies.findAll(options);

    if (opportunityCreateByUser) {
      return res.send({
        status: 1,
        message: req.__("success"),
        data: opportunityCreateByUser,
      });
    } else {
      return res.send({
        status: 0,
        message: "something went wrong!!!",
      });
    }
  } catch (error) {
    return res.send({
      status: 0,
      message: error.message,
      data: {},
    });
  }
};

// Application manager where the user applied for...
exports.getAllOpportunityUserAppliedFor = async (req, res) => {
  try {
    // get the req user id
    let id = req?.userId;
    let user = req?.user;
    let oppStatus = req?.query.type;
    if (!oppStatus) {
      return res.json({
        status: 0,
        message: "Unable to fetch the request",
      });
    }
    // let employeeNameDetails = `${user?.firstName} ${user?.lastName} `;
    // let getFilteredData;
    let finalResponse;
    let options = {
      where: {
        userId: id,
        deleted: 0,
      },
      attributes: ["id", "userId", "opportunity_id", "opp_type", "opp_status", "deleted"],
      include: [
        {
          association: "opportunityDetails",
          attributes: ["id", "userId", "recruit_start", "opportunity_desc", "opportunity_name", "recruit_end", "project_start", "project_end", "engagement_type", "commit_time", "deleted"],
          where: {
            deleted: 0,
          },
          include: [
            {
              association: "user",
              attributes: ["id", "firstName", "lastName", "profilePicture"],
              where: {
                deleted: 0,
              },
            },
          ],
        },
      ],
    };

    const getAllOpportunity = await models.opportunities_applies.findAll(options);

    if (getAllOpportunity) {
      switch (oppStatus) {
        case "applied":
        case "rejected":
          finalResponse = await this.getFilteredOpportunity(id, oppStatus);
          break;
        case "accepted":
          finalResponse = await this.getFilteredOpportunityAcceptedOpp(id);
          break;

        case "in-progress":
          finalResponse = await this.getFilteredOpportunityInProgressOpp(id);
          break;

        case "completed":
          finalResponse = await this.getFilteredOpportunityInCompleteOpp(id);
          break;
        default:
          return res.json({
            status: 0,
            message: "Invalid Parameters. Please provide a valid status.",
          });
      }

      return res.send({
        status: 1,
        message: req.__("success"),
        data: finalResponse,
      });
    } else {
      return res.send({
        status: 0,
        message: "something went wrong!!!",
      });
    }
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
};

// employee apply for the opportunity...
exports.employeeApplyForOpportunity = async (req, res) => {
  try {
    let { opportunity_id, project_start, project_end } = req?.body;
    let userDetails = req?.user;
    // check the user have the completed profile details or not============>
    if (userDetails.isCompleted === 0) {
      return res.json({
        status: 0,
        message: "Please complete Your Profile.",
        data: {},
      });
    }
    let oppOptions = {
      where: {
        id: opportunity_id,
      },
      include: [
        {
          association: "user",
        },
      ],
    };
    // get the details for the opportunity==========>
    let oppDetails = await models.opportunities.findOne(oppOptions);
    let options = {
      userId: req?.userId,
      opportunity_id: opportunity_id,
      project_start: project_start,
      project_end: project_end,
      createdBy: req?.userId,
      deleted: 0,
    };
    const response = await models.opportunities_applies.create(options);
    if (response) {
      // create the event when the employee apply for the opportunity.
      const employeeName = `${oppDetails?.user?.firstName} ${oppDetails?.user?.lastName}`;
      SaveEventService(APPLY_OPPORTUNITY, {
        userId: userDetails?.id,
        email_to: userDetails?.email,
        replacements: {
          EMPLOYEE_NAME: `${userDetails.firstName} ${userDetails.lastName}`,
          OPPORTUNITY_NAME: oppDetails.opportunity_name,
          OPPORTUNITY_URL: process.env.APP_URL + "user/dashboard?tab=opportunities",
        },
      });
      return res.send({
        status: 1,
        message: req.__("Application sent to {{employeeName}}", {
          employeeName: employeeName,
        }),
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("Unable to Apply."),
      });
    }
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// get all active opportunities===========>
exports.getAllManagerActiveOpportunitiesList = async (req, res) => {
  try {
    let userId = req?.userId;
    let getTodayDate = CommonService.generateTodaysDate();
    let options = {
      where: {
        userId: userId,
        deleted: 0,
        project_end: {
          [Op.gte]: getTodayDate,
        },
      },
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "profilePicture"],
        },
        {
          association: "opportunitySkill",
          include: [
            {
              association: "skill",
            },
          ],
        },
      ],
      order: [
        ["createdAt", "DESC"], // Sort by createdAt in descending order
      ],
    };

    const response = await models.opportunities.findAll(options);
    if (response) {
      return res.send({
        status: 1,
        message: req.__("Fetch Opportunity SuccessFul."),
        data: response,
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("opportunity is not present"),
      });
    }
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// get all complete opportunities============>
exports.getAllManagerCompleteOpportunitiesList = async (req, res) => {
  try {
    let userId = req?.userId;
    let getTodayDate = CommonService.generateTodaysDate();
    let options = {
      where: {
        userId: userId,
        deleted: 0,
        project_end: {
          [Op.lte]: `${getTodayDate} `,
        },
      },
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "profilePicture"],
        },
        {
          association: "opportunitySkill",
          include: [
            {
              association: "skill",
            },
          ],
        },
      ],
      order: [
        ["createdAt", "DESC"], // Sort by createdAt in descending order
      ],
    };

    const response = await models.opportunities.findAll(options);

    if (response) {
      return res.send({
        status: 1,
        message: req.__("Fetch Opportunity SuccessFul."),
        data: response,
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("opportunity is not present"),
      });
    }
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// delete active opportunity============>
exports.deleteActiveOpportunity = async (req, res) => {
  try {
    let id = req.params.id;
    const userId = req?.user?.id;
    let actionLogOption;
    // check the id validations=====>
    const checkExist = CommonService.validateParamsId(id);
    if (!checkExist) {
      return res.json({
        status: 0,
        message: "id_not_provided",
      });
    }
    let options = {
      where: {
        deleted: 0,
        id: id,
      },
    };
    //  delete validaton for Active opportunity if employees ======>
    let { status, message } = await OpportunityService.checkTheAppliedApplicants(id);
    if (!status) {
      return res.json({
        status: status,
        message: message,
      });
    }
    const response = await models.opportunities.findOne(options);
    if (response) {
      let checkLoggedUser = await OpportunityService.checkLoggedUserOpportunity(userId, response);

      if (!checkLoggedUser.status) {
        return await CommonService.ResponseMessage(checkLoggedUser.status, checkLoggedUser.message, res);
      }

      // action log for delete active opportunity============>
      actionLogOption = await CommonService.actionLogs("OPPORTUNITY_active", response.id, DELETE, options, response.id, req, res);
      await response.update({ deleted: 1, updatedBy: req.user.id }, { id: req?.user?.id, ...actionLogOption });
      return res.send({
        status: 1,
        message: req.__("Deleted"),
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("No records found"),
      });
    }
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};
// get the recommended opportunity =========>
exports.getRecommendedOpportunity = async (req, res) => {
  try {
    let user = req?.user;
    // get the todays date=================>
    let getTodaysDate = CommonService.generateTodaysDate();
    let userSkills = [];
    // Check if the user object contains the 'userSkill' property
    if (user?.userSkill && user?.userSkill?.length > 0) {
      // Filter the skills from user.userSkill with 'type' as 'skill'
      userSkills = user.userSkill.filter((skill) => ["skill", "interest"].includes(skill.type)).map((skill) => "'" + skill?.skillInterest?.name + "'");
    }
    // getAllOpportuntities for which user applied===========>
    const getAllAppliedOpportunity = await models.opportunities_applies.findAll({ where: { userId: req?.user?.id } });
    let appliedOpportunityIds = getAllAppliedOpportunity.map((opp) => opp.opportunity_id);
    // Order by the presence of user skills (descending order)
    const OrderRecommSql = `(SELECT COUNT(*) FROM opportunities_skills_interest_locations AS os LEFT JOIN masterDropdowns AS s ON os.reference_id = s.id WHERE os.opportunity_id = opportunities.id AND s.type IN ('skill','name') AND s.name IN(${userSkills.toString()}))`;
    // Skills and Interest Recommendation Query
    let SkillIntRecomSql = `(SELECT opportunity_id FROM opportunities_skills_interest_locations WHERE type IN ('interest', 'skill') and reference_id IN (SELECT reference_id FROM user_skills_or_interests WHERE userId=${user.id} AND deleted = 0 and type IN ('interest', 'skill')))`;
    // Location Filter to Recommendation
    let LocRecommSql = `(SELECT opportunity_id FROM opportunities_skills_interest_locations WHERE type = 'location' and (reference_id IN (SELECT reference_id FROM user_skills_or_interests WHERE userId=${user.id} AND deleted = 0 and type = 'location') OR reference_id = 7))`;
    // 7 reference Id is for global locations
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
          required: true, // Make user association required
          where: {
            deleted: 0,
          },
        },
      ],
      where: {
        deleted: 0,
        userId: {
          [Op.ne]: user.id,
        },
        id: {
          [Op.and]: [{ [Op.notIn]: appliedOpportunityIds }, { [Op.in]: [Sequelize.literal(SkillIntRecomSql)] }, { [Op.in]: [Sequelize.literal(LocRecommSql)] }],
        },
        recruit_start: {
          [Op.lte]: getTodaysDate,
        },
        recruit_end: {
          [Op.gte]: getTodaysDate,
        },
      },
      order: [
        [Sequelize.literal(OrderRecommSql), "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: 15,
    };
    let RecommOpps = await models.opportunities.findAll(QueryOptions);
    // Send Response
    if (RecommOpps.length >= 0) {
      return res.send({
        status: 1,
        count: RecommOpps.length,
        data: RecommOpps,
        message: req.__("success"),
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("No records found"),
      });
    }
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
};

// manage the opportunities scenerio===================>

// get filtereed reject and applied opportunities=========>
exports.getFilteredOpportunity = async (id, status) => {
  try {
    let getStatus = status === "applied" ? 0 : 2;
    let options = {
      where: {
        deleted: 0,
      },
      include: [
        {
          association: "opportunitiesAppliedData",
          where: {
            userId: id,
            deleted: 0,
            opp_status: getStatus,
          },
        },
        {
          association: "opportunitySkill",
          include: [
            {
              association: "skill",
              order: [["createdAt", "DESC"]],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]], // Order by createdAt in descending order
    };

    const getAllOpportunity = await models.opportunities.findAll(options);

    return getAllOpportunity;
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// get filtered accepteed opportunities=============>
exports.getFilteredOpportunityAcceptedOpp = async (id) => {
  try {
    let getTodayDate = CommonService.generateTodaysDate();
    let options = {
      where: {
        deleted: 0,
        project_start: {
          [Op.gte]: `${getTodayDate} `,
        },
      },
      include: [
        {
          association: "opportunitiesAppliedData",
          where: {
            userId: id,
            deleted: 0,
            opp_status: 1,
          },
        },
        {
          association: "opportunitySkill",
          order: [["createdAt", "DESC"]], // Order by createdAt in descending order
          include: [
            {
              association: "skill",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]], // Order by createdAt in descending order
    };

    const getAllOpportunity = await models.opportunities.findAll(options);

    return getAllOpportunity;
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// get filtered in-progress opportunities==========>
exports.getFilteredOpportunityInProgressOpp = async (id) => {
  try {
    let getTodayDate = CommonService.generateTodaysDate();
    let options = {
      where: {
        deleted: 0,
        project_start: {
          [Op.lte]: `${getTodayDate} `,
        },
        project_end: {
          [Op.gte]: `${getTodayDate} `,
        },
      },
      include: [
        {
          association: "opportunitiesAppliedData",
          where: {
            userId: id,
            deleted: 0,
            opp_status: 1,
          },
        },
        {
          association: "opportunitySkill",
          order: [["createdAt", "DESC"]], // Order by createdAt in descending order
          include: [
            {
              association: "skill",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]], // Order by createdAt in descending order
    };

    const getAllOpportunity = await models.opportunities.findAll(options);

    return getAllOpportunity;
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// get filtered completed opportunities==============>
exports.getFilteredOpportunityInCompleteOpp = async (id) => {
  try {
    let getTodayDate = CommonService.generateTodaysDate();
    let options = {
      where: {
        deleted: 0,
        project_end: {
          [Op.lte]: `${getTodayDate} `,
        },
      },
      include: [
        {
          association: "opportunitiesAppliedData",
          where: {
            userId: id,
            deleted: 0,
            opp_status: 1,
          },
        },
        {
          association: "opportunitySkill",
          order: [["createdAt", "DESC"]], // Order by createdAt in descending order
          include: [
            {
              association: "skill",
            },
          ],
        },
        {
          association: "opportunityFeedbackStatus",
          attributes: ["user_review_status"],
          where: {
            userId: id,
          },
        },
      ],
      order: [["createdAt", "DESC"]], // Order by createdAt in descending order
    };

    const getAllOpportunity = await models.opportunities.findAll(options);

    return getAllOpportunity;
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// get all the completed teams list============>
exports.getAllCompletedTeams = async (req, res) => {
  try {
    const id = req?.params?.id;
    const userId = req?.user?.id;
    let options = {
      where: {
        opportunity_id: id,
        opp_status: 1,
      },
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "profilePicture", "profile_title"],
          required: false,
          include: [
            {
              association: "userFeedbackDetails",
              attributes: ["manager_review_status"],
              required: false,
              where: {
                opportunity_id: id,
                manager_id: userId,
              },
            },
          ],
        },
      ],
      order: [
        ["createdAt", "DESC"], // Sort by createdAt in descending order
      ],
    };
    const response = await models.opportunities_applies.findAll(options);
    if (response) {
      return res.send({
        status: 1,
        message: req.__("teams data sucessfully."),
        data: response,
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("Unable to Fetch teams."),
      });
    }
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// get all the active teams list ==================>
exports.getAllActiveTeamsList = async (req, res) => {
  try {
    const id = req?.params?.id;
    // const userId = req?.user?.id;
    let options = {
      where: {
        opportunity_id: id,
      },
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "profilePicture", "profile_title"],
        },
      ],
    };

    const response = await models.opportunities_applies.findAll(options);
    if (response) {
      return res.send({
        status: 1,
        message: req.__("teams data sucessfully."),
        data: response,
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("Unable to Fetch teams."),
      });
    }
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// fetch all the posted opportunity by id============>
exports.getAllPostedOpportunityById = async (req, res) => {
  try {
    const id = req?.params?.id;
    let options = {
      where: {
        userId: id,
        deleted: 0,
      },
      include: {
        association: "opportunitySkill",
        include: [
          {
            association: "skill",
          },
        ],
      },
    };
    let getAllPostedOpportunityResponse = await models.opportunities.findAll(options);

    if (getAllPostedOpportunityResponse.length > 0) {
      return res.send({
        status: 1,
        data: getAllPostedOpportunityResponse,
        message: req.__("success"),
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("No records found"),
      });
    }
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};

// fetch all the applied opportunity by id===========>
exports.getAllAppliedOpportunityById = async (req, res) => {
  try {
    let id = req?.params?.id;

    let options = {
      where: {
        deleted: 0,
      },
      include: [
        {
          association: "opportunitiesAppliedData",
          attributes: ["id", "userId", "opportunity_id", "opp_status"],
          where: {
            userId: id,
            deleted: 0,
          },
        },
        {
          association: "opportunitySkill",
          include: [
            {
              association: "skill",
            },
          ],
        },
      ],
    };

    const getAllAppliedOpportunityResponse = await models.opportunities.findAll(options);

    if (getAllAppliedOpportunityResponse.length > 0) {
      return res.send({
        status: 1,
        data: getAllAppliedOpportunityResponse,
        message: req.__("success"),
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("No records found"),
      });
    }
  } catch (error) {
    CommonService.filterError(error, req, res);
  }
};
