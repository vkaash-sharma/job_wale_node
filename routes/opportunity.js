const express = require('express')
const OppRouter = express.Router();
const opportunityController = require('../controller/opportunity.controller')
const isAuth = require('../middleware/jwt_auth');
const {getRecommendedOppByUserId} = require('../services/OpportunityService');


// employee=======>
OppRouter.get('/more', isAuth, opportunityController.getMoreOpportunity);
OppRouter.get('/recommended', isAuth, opportunityController.getRecommendedOpportunity);
OppRouter.get("/applied-list", isAuth, opportunityController.getAllOpportunityUserAppliedFor)
OppRouter.get('/details/:id', isAuth, opportunityController.getOpportunityById);
OppRouter.post('/apply', isAuth, opportunityController.employeeApplyForOpportunity);

// manager========>
OppRouter.post('/mng/create', isAuth, opportunityController.postOpportunity);
OppRouter.get('/mng/appiled', isAuth, opportunityController.opportunityAppliedUser);
OppRouter.get('/mng/active-list', isAuth, opportunityController.getAllManagerActiveOpportunitiesList);
OppRouter.get('/mng/completed-list', isAuth, opportunityController.getAllManagerCompleteOpportunitiesList);
OppRouter.delete('/mng/delete/:id', isAuth, opportunityController.deleteActiveOpportunity);
// teams======>
OppRouter.get('/team-completed/:id', isAuth, opportunityController.getAllCompletedTeams);
OppRouter.get('/team-active/:id', isAuth, opportunityController.getAllActiveTeamsList)

OppRouter.get('/post-opportunity/:id', isAuth, opportunityController.getAllPostedOpportunityById);
OppRouter.get('/applied-opportunity/:id', isAuth, opportunityController.getAllAppliedOpportunityById)





module.exports = OppRouter