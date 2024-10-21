const clog = require("../services/ChalkService");
const { generateUTCTimestamp } = require("../services/CommonService");
const CommonService = require("../services/CommonService");
const models = require("../models/index");
const { Op } = require("sequelize");
let ReviewService = require('../services/review.service');
const { CREATED } = require("../config/action.config");

// fetch all the received / sent reviews==================>
exports.getReviews = async (req, res) => {
  try {
    const { userType, todoType } = req?.query;
    clog.success("getReviews", userType, todoType);
    let dataReview;
    let options = {
      include: [
        {
          association: "userDetails",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "profilePicture",
            "profile_title",
          ],
        },
        {
          association: "managerDetails",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "profilePicture",
            "profile_title",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    };

    if (userType === "user") {
      if (todoType === "received") {
        options.where = {
          userId: req?.user?.id,
          manager_review_status: 1,
        };
      } else if (todoType === "sent") {
        options.where = {
          userId: req?.user?.id,
          user_review_status: 1,
        };
      }
    }
    if (userType === "manager") {
      if (todoType === "received") {
        options.where = {
          manager_id: req?.user?.id,
          user_review_status: 1,
        };
      } else if (todoType === "sent") {
        options.where = {
          manager_id: req?.user?.id,
          manager_review_status: 1,
        };
      }
    }

    dataReview = await models.opportunities_assigned_with_feedbacks.findAll(
      options
    );

    res.send({
      status: 1,
      message: req.__("Reviews Data Fetch Successfully.."),
      data: dataReview,
    });
  } catch (error) {
    await CommonService.filterError(error, req, res);
  }
};

// fetch all the todoReview ===========================>
exports.todoReview = async (req, res) => {
  try {
    const { userType } = req?.query;
    let todayDate = CommonService.generateTodaysDate();
    let data;
    if (userType === "user") {
      let options = {
        where: {
          userId: req?.user?.id,
          user_review_status: 0,
        },
        include: [
          {
            association: "userDetails",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "profilePicture",
              "profile_title",
            ],
          },
          {
            association: "managerDetails",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "profilePicture",
              "profile_title",
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      };
      data = await models.opportunities_assigned_with_feedbacks.findAll(
        options
      );
      clog.success(data);
    } else if (userType === "manager") {
      let options = {
        where: {
          manager_id: req?.user?.id,
          manager_review_status: 0,
        },
        include: [
          {
            association: "userDetails",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "profilePicture",
              "profile_title",
            ],
          },
          {
            association: "managerDetails",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "profilePicture",
              "profile_title",
            ],
          },
          {
            association: "opportunityIdFeedback",
            attributes: [
              "id",
              "userId",
              "opportunity_name",
              "opportunity_desc",
              "recruit_start",
              "recruit_end",
              "project_start",
              "project_end",
            ],
            where: {
              //   project_start : {
              //     [Op.lte] : todayDate
              //   } ,
              project_end: {
                [Op.lte]: todayDate,
              },
            },
          },
        ],
        order: [["createdAt", "DESC"]],
      };
      data = await models.opportunities_assigned_with_feedbacks.findAll(
        options
      );
    }

    return res.send({
      status: 1,
      message: req.__("success"),
      data: data,
    });
  } catch (error) {
     await CommonService.filterError(error, req, res);
  }
};
// fetch the todo byt its id===================>

// post review =================>
exports.postReviews = async (req, res) => {
  try {
    const { desc, rating, OpportunityId, userId , userType } = req?.body;
    const id = req?.user?.id;
    const todayDate = generateUTCTimestamp();
    // check wheather all the fields are required passed in the body
    let checkExist = await ReviewService.postReviewValidation(id , desc , rating , OpportunityId , userType) ;
    let actionLogOption ={id : req?.user?.id}
    if(!checkExist.status) {
      return await CommonService.ResponseMessage(checkExist.status,checkExist.message,res);
    }
    if (userType === "user") {
      let options = {
        where: {
          userId: id,
          opportunity_id: parseInt(OpportunityId),
          user_review_status: 0,
        },
        include : [{
          association : "managerDetails" ,
          where : {
            deleted : 0
          }
        }]
      };
      const getDataResponse = await models.opportunities_assigned_with_feedbacks.findOne(options);
      actionLogOption = await CommonService.actionLogs(
        "Post-Review",
        getDataResponse.id,
        CREATED,
        actionLogOption,
        getDataResponse.id,
        req,
        res
      )
       if(getDataResponse) {
          await getDataResponse.update({
            user_review_desc: desc,
            user_star_rating: rating,
            user_review_time: todayDate,
            user_review_status: 1,
            createdBy : id
          },actionLogOption) ;
          let managerDetails = `${getDataResponse?.managerDetails?.firstName} ${getDataResponse?.managerDetails?.lastName}` ;
          return res.json({
            status: 1,
            message: req.__('Review sent to {{managerDetails}}' ,{ managerDetails : managerDetails}),
          })  
       }else {
          return await CommonService.ResponseMessage(0, "Unable to Post Review." , res);
       }
    } else if (userType === "manager") {
      let options = {
        where: {
          manager_id: id,
          userId: userId,
          opportunity_id: parseInt(OpportunityId),
          manager_review_status: 0,
        },
        include : [{
              association : "userDetails" ,
              where : {
                deleted : 0
              }
          }
        ]
      };
      const getDataResponse = await models.opportunities_assigned_with_feedbacks.findOne(options);
       if(getDataResponse) {
          let userDetails = `${getDataResponse?.userDetails?.firstName} ${getDataResponse?.userDetails?.lastName}` ;
          await getDataResponse.update(
            {
              manager_review_desc: desc,
              manager_star_rating: rating,
              manager_review_time: todayDate,
              manager_review_status: 1,
              createdBy : id
            },actionLogOption);
      
          return res.json({
            status: 1,
            message: req.__('Review sent to {{userDetails}}' , {userDetails : userDetails}),
          })
       }else {
        return await CommonService.ResponseMessage(0, "Unable to Post Review." , res);
       }
    }else {
        return res.send({
          status: 1,
          message: req.__("Something went wrong."),
        });
  }
  } catch (error) {
     await CommonService.filterError(error, req, res);
  }
};
