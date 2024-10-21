const EVENTS_CONSTANTS = require("../config/events.config");
const models = require("../models/index");
const clog = require("../services/ChalkService");
const CommonService = require("../services/CommonService");
const { SaveEventService } = require("../services/events.service");
const { CREATED, UPDATE } = require("../config/action.config");
exports.applicationStatusHandle = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const query = req?.query;
    const handleType = query.handleType;
    let reponseFeedback;
    // const user
    if (query?.handleType) {
      let actionLogOption = {id : req?.user?.id};
      let options = {
        where: {
          id: applicationId,
        },
        include: [
          {
            association: "user",
            attributes: ["id", "firstName", "lastName", "email"],
          },
          {
            association: "opportunityDetails",
            attributes: ["opportunity_name"],
          },
        ],
      };
      const response = await models.opportunities_applies.findOne(options);
      // clog.success("firstName and lastName" , response?.user?.firstName , response?.user?.lastName)
      // post the entry for the feedback review for employee and manager============>
      if (response) {
        // trigger event for successfull accept
        // fields required for event trigger
        let managerName = req.user?.firstName + " " + req?.user?.lastName;
        let employeeName =
          response?.user.firstName + " " + response?.user?.lastName;
        let opportunityName = response?.opportunityDetails?.opportunity_name;
        let employeeEmail = response?.user?.email;
        let eventName =
          handleType == "accept"
            ? EVENTS_CONSTANTS.EMPLOYEE_EVALUATION_SUCCESS
            : EVENTS_CONSTANTS.EMPLOYEE_EVALUATION_REJECT;
            
        await SaveEventService(eventName, {
          userId: response.userId,
          email_to: employeeEmail,
          replacements: {
            EMPLOYEE_NAME: employeeName,
            MANAGER_NAME: managerName,
            OPPORTUNITY_NAME: opportunityName,
            OPPORTUNITY_URL:
              process.env.APP_URL + "user/dashboard?tab=opportunities",
          },
        });
        actionLogOption =  await CommonService.actionLogs(
          "opportunities_applies",
          response?.id,
          UPDATE,
          actionLogOption,
          response?.id,
          req)
        // End trigger Event
        if (handleType === "accept") {
          response.update({ opp_status: 1 },{id:req?.user?.id,...actionLogOption});
          // Creating Feedback for opportunity if accepted it
           reponseFeedback = await models.opportunities_assigned_with_feedbacks.create({
              opportunity_id: response.dataValues.opportunity_id,
              userId: response.dataValues.userId,
              manager_id: req?.user?.id,
              deleted: 0,
            });
          return res.json({
            status: 1,
            message: req.__(
              "{{employeeName}} has been notified of your selection. Please organize a meeting to introduce them to your project and the team.",
              { employeeName: employeeName }
            ),
          });
        } else {
          response.update({ opp_status: 2 },{id:req?.user?.id,...actionLogOption});
          return res.json({
            status: 1,
            message: req.__(
              "{{employeeName}} has been notified of your rejection for the {{opportunityName}}. Please organize a meeting to de-brief on why they didn't meet your criteria.",
              { employeeName: employeeName, opportunityName: opportunityName }
            ),
          });
        }
      }
    } else {
      return res.json({
        status: 0,
        message: "data not found!",
      });
    }
  } catch (error) {
    const return_data = await CommonService.filterError(error, req, res);
    return res.json(return_data);
  }
};
