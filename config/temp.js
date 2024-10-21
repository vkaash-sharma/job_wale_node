/* exports.getRecommendedOpportunity = async (req, res) => {
  try {
    let userId = req?.user?.id;
    let userDetails = req.user;
    let userSkills;
    clog.info("hello");
    let getTodaysDate = CommonService.generateTodaysDate();
    let getAllRecomendedOpportunities;
    // clog.success("challog" , userDetails)
    // Check if the user object contains the 'userSkill' property
    if (
      userDetails &&
      userDetails.userSkill &&
      userDetails.userSkill.length > 0
    ) {
      // Filter the skills from userDetails.userSkill with 'type' as 'skill'
      userSkills = userDetails.userSkill
        .filter((skill) => skill.type === "skill")
        .map((skill) => skill.skillInterest.name);
    }

    if (userSkills?.length > 0) {
      let orderByQueryItem = "";
      userSkills.forEach((element) => {
        orderByQueryItem += `md.name='${element}' DESC, `;
      });

      // get all the recommended opportunity  userSkill -> oppSkill

      const opportunitiesQuery = `SELECT op.* , op.id, op.opportunity_name, md.id skillId, md.name
        FROM opportunities op
        LEFT JOIN opportunities_skills_interest_locations os ON os.opportunity_id = op.id
        LEFT JOIN masterDropdowns md ON md.id = os.reference_id
        Left join opportunities_applies oa on oa.opportunity_id=op.id and oa.userId = ${userId}
        WHERE md.type = 'skill' AND md.deleted = 0 AND op.deleted = 0 AND os.deleted = 0 and oa.opportunity_id is null and oa.userId is null and op.recruit_start<='${getTodaysDate}' and op.recruit_end>='${getTodaysDate}'
      ORDER BY ${orderByQueryItem} op.createdAt  DESC 
      LIMIT 15 `;
      // opportunitiesAppliedDataa.opportunity_id=op.id and oa.userId = $
      //   WHERE md.type = 'skill' AND md.deleted = 0 AND op.deleted = 0 AND os.deleted = 0 and oa.opportunity_id is null and oa.userId is null;

      const replacements = userSkills || []; // Values to replace placeholders

      // fetch all the data ============>
      getAllRecomendedOpportunities = await models.sequelize.query(
        opportunitiesQuery,
        {
          replacements,
          type: models.Sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
    } else {
      let options = {
        where: {
          deleted: 0,
        },
        limit: 15,
      };
      getAllRecomendedOpportunities = await models.opportunities.findAll(
        options
      );
    }

    //  create the options
    let options = {
      attributes: [
        "id",
        "opportunity_name",
        [Sequelize.fn("count", "opportunitiesAppliedData.id"), "applied_count"],
      ],
      include: [
        {
          association: "opportunitySkill",
          required: false,
          where: {
            deleted: 0,
          },
          include: [
            {
              association: "skill",
              required: false,
              where: {
                deleted: 0,
              },
            },
          ],
        },
        {
          association: "opportunitiesAppliedData",
          required: false,
          where: {
            deleted: 0,
            opportunity_id: null,
            userId,
          },
        },
      ],
      where: {
        deleted: 0,
        recruit_end: {
          [Op.gte]: `${getTodaysDate}`,
        },
      },
      group: ["opportunities.id"],
    };
    // solve using the sequelize code
    getAllRecomendedOpportunities = await models.opportunities.findAll(
      options
    );
    if (getAllRecomendedOpportunities.length > 0) {
      return res.send({
        status: 1,
        data: getAllRecomendedOpportunities.length,
        message: req.__("success"),
      });
    } else {
      return res.send({
        status: 0,
        message: req.__("no_record_found"),
      });
    }
  } catch (error) {
    const return_data = CommonService.filterError(error, req, res);
    res.json(return_data);
  }
}; */