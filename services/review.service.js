const clog = require("./ChalkService");
const CommonService = require("./CommonService");
exports.postReviewValidation = async (
  id,
  desc,
  rating,
  OpportunityId,
  userType
) => {
  try {
    if (!id) {
      return {
        status: 0,
        message: "User is not Authorized.",
      };
    }

    if (!desc || !rating || !OpportunityId) {
      return {
        status: 0,
        message: "All Missing Field Required.",
      };
    }
    if(desc.length > 512) {
      return {
        status :0 ,
        message : "Description: Max 512 Character required"
      }
    }
    if (!["user", "manager"].includes(userType)) {
      return {
        status: 0,
        message: "User Type is Invalid.",
      };
    }

    return { status: 1 };
  } catch (error) {
    await CommonService.filterError(error);
    clog.error(error);
    return false;
  }
};
