const {Op} = require("sequelize");
const {EMPLOYEE_END_PROJECT, RECOMMENDED_OPPORTUNITY, MANAGER_END_PROJECT} = require("../config/events.config");
const {sequelize} = require("../models");
const clog = require("./ChalkService");
const CommonService = require("./CommonService");
const {fetchTheRecommendedOpportunity, getRecommendedOppByUserId} = require("./OpportunityService");
const {SaveEventService} = require("./events.service");
const models = require('../models/index')

// this function will run and update all the completed opportunities
exports.CompletedOpportunitySchedule = async () => {
    try {
        // Fetch all the completed opportunity===========>
        clog.success("Sending Completed Email")
        let getTodayDate = CommonService.generateTodaysDate();
        let options = {
            where: {
                deleted: 0,
                sent_status: 0,
                project_end: {
                    [Op.lte]: `${getTodayDate}`,
                },
            },
            include: [
                {
                    association: "user",
                    attributes: [
                        "id",
                        "firstName",
                        "email",
                        "lastName",
                        "profilePicture",
                    ],
                    where: {
                        deleted: 0,
                    }
                },
                {
                    association: "opportunitiesAppliedData",
                    include: [
                        {
                            association: "user",
                            attributes: [
                                "id",
                                "firstName",
                                "email",
                                "lastName",
                                "profilePicture",
                            ],
                            where: {
                                deleted: 0,
                            }
                        },
                    ],
                },
            ],
            order: [
                ["createdAt", "DESC"], // Sort by createdAt in descending order
            ],
        };
        const getAllCompletedOpportunityManager =
            await models.opportunities.findAll(options);
        // iterate to get the Manager Details======>
        for (const opp of getAllCompletedOpportunityManager) {
            // Save Event for Manager End Project
            const managerId = opp?.user?.id;
            const managerEmail = opp?.user?.email;
            let managerNameDetail = `${opp?.user?.firstName} ${opp?.user?.lastName}`;
            let employeesNameArr = [];
            let employeeStringName;

            // save event for the user end project======>
            for (const val of opp.opportunitiesAppliedData) {
                const userId = val?.user?.id;
                const userEmail = val?.user?.email;
                let userNameDetails = `${val?.user?.firstName} ${val?.user?.lastName}`;
                if (val.opp_status === 1) {
                    // fire event for the user end project====>
                    await SaveEventService(EMPLOYEE_END_PROJECT, {
                        userId: userId,
                        email_to: userEmail,
                        replacements: {
                            OPPORTUNITY_NAME: opp?.opportunity_name,
                            EMPLOYEE_NAME: userNameDetails,
                            MANAGER_NAME: managerNameDetail,
                            OPPORTUNITY_URL : process.env.APP_URL+'user/dashboard?tab=opportunities'
                        },
                    });
                    employeesNameArr.push(userNameDetails);
                }
            }

            // Join employee names after the loop is completed
            employeeStringName = employeesNameArr.join(', ');

            // Fire Event for the manager End project===>
            await SaveEventService(MANAGER_END_PROJECT, {
                userId: managerId,
                email_to: managerEmail,
                replacements: {
                    OPPORTUNITY_NAME: opp.opportunity_name,
                    MANAGER_NAME: managerNameDetail,
                    EMPLOYEE_NAME: employeeStringName || '',
                    OPPORTUNITY_URL : process.env.APP_URL+'manager/dashboard?tab=completed'
                },
            });
            // update the sent_status====>
            // 
            await opp.update({sent_status: 1});
        };
    } catch (error) {
        console.log(error);
        return false;
    }
};

//for recommendation event ============>
exports.OpportunityRecommendation = async () => {
    try {
        clog.success("Recommended opportunity...");
        //  fetch all the users for the table ======>
        let userOptions = {
            where: {
                deleted: 0,
                isCompleted: 1,
                activeStatus: 1,
                email_verify: 1
            },
            include: [
                {association: "userRole", include: [{association: "role"}]},
                {association: "userSkill"}
            ],
        };
        const users = await sequelize.models.users.findAll(userOptions);
        users.forEach(async (user, userIndex) => {
            // check wheather the user have skill or not====>
            if(user.userSkill.length > 0) {
                const recommendedOpp = await getRecommendedOppByUserId(user.id);
            if (recommendedOpp && user) {
                await SaveEventService(RECOMMENDED_OPPORTUNITY, {
                    userId: user?.id,
                    email_to: user?.email,
                    replacements: {
                        OPPORTUNITY_NAME: recommendedOpp.opportunity_name,
                        OPPORTUNITY_URL: process.env.APP_URL + 'user/dashboard'
                    }
                })
            }
            }
        })
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}