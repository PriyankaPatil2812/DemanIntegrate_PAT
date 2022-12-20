var express = require("express");
var router = express.Router();
// var flash= require('connect-flash');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const validateLoginInput = require('../validation/login');
var pool = require('./database/database');
var log = require('../configuration/logger').LOG
let emailSend = require('./emailSend');
var dateTime = require("node-datetime");

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./status/leadStatus.file');
var emailConfigYes=properties.get('emailConfig.yes');
var emailConfigNo=properties.get('emailConfig.no');
const authCheck=require('./check_auth')//Somnath Task:3852, Add route auth,I called authCheck function which is verify the token. If token is wrong then send auth error else continue on next execution
/**
* @author Supriya Gore
* @param  Description store email configuration Info
* @return Description return Successfully the info
*/
//Somnath Task-3852, Add authCheck Middleware
router.post('/emailConfigurationInfo',authCheck, function(req, res, next) {
    log.info("inside emailConfigurationInfo");
      var dt = dateTime.create();
      var formatted = dt.format("Y-m-d H:M:S");
     var userID=req.token.userID;
      var orgID=req.token.id;
      var campaignActivity=req.body.activity;
      // var publisherActivity=req.body.publisherActivity;
      // var leadActivity=req.body.leadActivity;
      // var deadlineActivity=req.body.deadlineActivity;
      // var otherActivity=req.body.otherActivity;

      var createCampaign =campaignActivity[0].createCampaign;
      if(createCampaign==null||createCampaign==undefined)
      {
        createCampaign=emailConfigNo;
      }

      var editCampaign=campaignActivity[0].editCampaign;

      if(editCampaign==null||editCampaign==undefined)
      {
        editCampaign=emailConfigNo;
      }

      var acceptCampaign=campaignActivity[0].acceptCampaign;

      if(acceptCampaign==null||acceptCampaign==undefined)
      {
        acceptCampaign=emailConfigNo;
      }

      var pauseCampaign=campaignActivity[0].pauseCampaign;

      if(pauseCampaign==null||pauseCampaign==undefined)
      {
        pauseCampaign=emailConfigNo;
      }

      var resumeCampaign=campaignActivity[0].resumeCampaign;

      if(resumeCampaign==null||resumeCampaign==undefined)
      {
        resumeCampaign=emailConfigNo;
      }

      var completeCampaign=campaignActivity[0].completeCampaign;

      if(completeCampaign==null||completeCampaign==undefined)
      {
        completeCampaign=emailConfigNo;
      }

      var rejectCampaign=campaignActivity[0].rejectCampaign;

      if(rejectCampaign==null||rejectCampaign==undefined)
      {
        rejectCampaign=emailConfigNo;
      }

      var counterCampaign=campaignActivity[0].counterCampaign;

      if(counterCampaign==null||counterCampaign==undefined)
      {
        counterCampaign=emailConfigNo;
      }

      var counterAcceptCampaign=campaignActivity[0].counterAcceptCampaign;

      if(counterAcceptCampaign==null||counterAcceptCampaign==undefined)
      {
        counterAcceptCampaign=emailConfigNo;
      }

      var counterRejectCampaign=campaignActivity[0].counterRejectCampaign;

      if(counterRejectCampaign==null||counterRejectCampaign==undefined)
      {
        counterRejectCampaign=emailConfigNo;
      }

      var leadUpload=campaignActivity[0].leadUpload;

      if(leadUpload==null||leadUpload==undefined)
      {
        leadUpload=emailConfigNo;
      }

      var leadReview=campaignActivity[0].leadReview;

      if(leadReview==null||leadReview==undefined)
      {
        leadReview=emailConfigNo;
      }

      var cancelPublisher=campaignActivity[0].cancelPublisher;

      if(cancelPublisher==null||cancelPublisher==undefined)
      {
        cancelPublisher=emailConfigNo;
      }

      var endDatePublisher=campaignActivity[0].endDatePublisher;

      if(endDatePublisher==null||endDatePublisher==undefined)
      {
        endDatePublisher=emailConfigNo;
      }

      var leadsDecrement=campaignActivity[0].leadsDecrement;

      if(leadsDecrement==null||leadsDecrement==undefined)
      {
        leadsDecrement=emailConfigNo;
      }

      var dailyUpdate=campaignActivity[0].dailyUpdate;

      if(dailyUpdate==null||dailyUpdate==undefined)
      {
        dailyUpdate=emailConfigNo;
      }

      var reAllocationCampaign=campaignActivity[0].reAllocationCampaign;

      if(reAllocationCampaign==null||reAllocationCampaign==undefined)
      {
        reAllocationCampaign=emailConfigNo;
      }

      var firstDeliveryDateWarn=campaignActivity[0].firstDeliveryDateWarn;

      if(firstDeliveryDateWarn==null||firstDeliveryDateWarn==undefined)
      {
        firstDeliveryDateWarn=emailConfigNo;
      }

      var firstDeliveryDateCross=campaignActivity[0].firstDeliveryDateCross;

      if(firstDeliveryDateCross==null||firstDeliveryDateCross==undefined)
      {
        firstDeliveryDateCross=emailConfigNo;
      }
      var linkAgencyPublisher=campaignActivity[0].linkAgencyPublisher;

      if(linkAgencyPublisher==null||linkAgencyPublisher==undefined)
      {
        linkAgencyPublisher=emailConfigNo;
      }
      var linkAgencyAdvertiser=campaignActivity[0].linkAgencyAdvertiser;

      if(linkAgencyAdvertiser==null||linkAgencyAdvertiser==undefined)
      {
        linkAgencyAdvertiser=emailConfigNo;
      }

      var acceptCampaignWarn=campaignActivity[0].acceptCampaignWarn;

      if(acceptCampaignWarn==null||acceptCampaignWarn==undefined)
      {
        acceptCampaignWarn=emailConfigNo;
      }

      var voiceLinkUpload=campaignActivity[0].voiceLinkUpload;

      if(voiceLinkUpload==null||voiceLinkUpload==undefined)
      {
        voiceLinkUpload=emailConfigNo;
      }

      var creativesUploadWarn=campaignActivity[0].creativesUploadWarn;

      if(creativesUploadWarn==null||creativesUploadWarn==undefined)
      {
        creativesUploadWarn=emailConfigNo;
      }

      var cancelPublisherCross=campaignActivity[0].cancelPublisherCross;

      if(cancelPublisherCross==null||cancelPublisherCross==undefined)
      {
        cancelPublisherCross=emailConfigNo;
      }

      var updateLeadsPermission= campaignActivity[0].updateLeadsPermission;

      if(updateLeadsPermission==null||updateLeadsPermission==undefined)
      {
        updateLeadsPermission=emailConfigNo;
      }

      var message=campaignActivity[0].message;

      if(message==null||message==undefined)
      {
        message=emailConfigNo;
      }

      var landingPageSubmit=campaignActivity[0].landingPageSubmit;

      if(landingPageSubmit==null||landingPageSubmit==undefined)
      {
        landingPageSubmit=emailConfigNo;
      }

      var creativeReview=campaignActivity[0].creativeReview;

      if(creativeReview==null||creativeReview==undefined)
      {
        creativeReview=emailConfigNo;
      }

      var campaignAllocation=campaignActivity[0].campaignAllocation;

      if(campaignAllocation==null||campaignAllocation==undefined)
      {
        campaignAllocation=emailConfigNo;
      }

      var pocSubmit=campaignActivity[0].pocSubmit;

      if(pocSubmit==null||pocSubmit==undefined)
      {
        pocSubmit=emailConfigNo;
      }

      var csSubmit=campaignActivity[0].csSubmit;

      if(csSubmit==null||csSubmit==undefined)
      {
        csSubmit=emailConfigNo;
      }

      var pocReview=campaignActivity[0].pocReview;

      if(pocReview==null||pocReview==undefined)
      {
        pocReview=emailConfigNo;
      }

      var activeCampaign=campaignActivity[0].activeCampaign;

      if(activeCampaign==null||activeCampaign==undefined)
      {
        activeCampaign=emailConfigNo;
      }

      var reportPublisher= campaignActivity[0].reportPublisher;

      if(reportPublisher==null||reportPublisher==undefined)
      {
        reportPublisher=emailConfigNo;
      }

      var biddingAllocation=campaignActivity[0].biddingAllocation;

      if(biddingAllocation==null||biddingAllocation==undefined)
      {
        biddingAllocation=emailConfigNo;
      }

      var biddingSubmission=campaignActivity[0].biddingSubmission;

      if(biddingSubmission==null||biddingSubmission==undefined)
      {
        biddingSubmission=emailConfigNo;
      }

      var addUser=campaignActivity[0].addUser;

      if(addUser==null||addUser==undefined)
      {
        addUser=emailConfigNo;
      }

      var biddingReview=campaignActivity[0].biddingReview;

      if(biddingReview==null||biddingReview==undefined)
      {
        biddingReview=emailConfigNo;
      }

      var tdrReport=campaignActivity[0].tdrReport;

      if(tdrReport==null||tdrReport==undefined)
      {
        tdrReport=emailConfigNo;
      }
      var pacingAlert=campaignActivity[0].pacingAlert;

      if(pacingAlert==null||pacingAlert==undefined)
      {
        pacingAlert=emailConfigNo;
      }
      
      var rfpAcknowledgement=campaignActivity[0].rfpAcknowledgement;

      if(rfpAcknowledgement==null||rfpAcknowledgement==undefined)
      {
        rfpAcknowledgement=emailConfigNo;
      }
      var invoiceReviewed=campaignActivity[0].invoiceReviewed;

      if(invoiceReviewed==null||invoiceReviewed==undefined)
      {
        invoiceReviewed=emailConfigNo;
      }

      var clientSetup=campaignActivity[0].clientSetup;

      if(clientSetup==null||clientSetup==undefined)
      {
        clientSetup=emailConfigNo;
      }

      var salesforceNotification=campaignActivity[0].salesforceNotification;

      if(salesforceNotification==null||salesforceNotification==undefined)
      {
        salesforceNotification=emailConfigNo;
      }
      var invoiceReviewAlert=campaignActivity[0].invoiceReviewAlert;
      if(invoiceReviewAlert==null||invoiceReviewAlert==undefined)
      {
        invoiceReviewAlert=emailConfigNo;
      }

      //Narendra Add Marketo Client Email Mail
      var marketoClientSetup=campaignActivity[0].marketoClientSetup;
      if(marketoClientSetup==null||marketoClientSetup==undefined)
      {
        marketoClientSetup=emailConfigNo;
      }

      var marketoNotification=campaignActivity[0].marketoNotification;
      console.log("marketoNotification==>"+marketoNotification)
      if(marketoNotification==null||marketoNotification==undefined)
      {
        marketoNotification=emailConfigNo;
      }

      var hubspotClientSetup=campaignActivity[0].hubspotClientSetup;
      if(hubspotClientSetup==null||hubspotClientSetup==undefined)
      {
        hubspotClientSetup=emailConfigNo;
      }

      var hubspotNotification=campaignActivity[0].hubspotNotification;
      if(hubspotNotification==null||hubspotNotification==undefined)
      {
        hubspotNotification=emailConfigNo;
      }
      //Sonali-3533-added to send followup mail to commercial agency
      var RFPFollowupEmail=campaignActivity[0].rfpFollowupEmail;
      if(RFPFollowupEmail==null||RFPFollowupEmail==undefined)
      {
        RFPFollowupEmail=emailConfigNo;
      }

      //Somnath Task-3526, Add RFP Reminder in email config
      var rfpSetupReminder=campaignActivity[0].rfpSetupReminder;
      if(!rfpSetupReminder){
        rfpSetupReminder=emailConfigNo;
      }

      //Somnath Task-3797, Add RFP Active from archive in email config
      var activeRFP=campaignActivity[0].activeRFP;
      if(!activeRFP){
        activeRFP=emailConfigNo;
      }

      var emailQuery = "select userID,orgID from email_configuration where userID='"+userID+"' and orgID='"+orgID+"'";
      pool.query(emailQuery,function(error,emailResults,fields){
        if(error){
          log.error("Error inside emailConfigurationInfo==>"+error);
            return res.status(400).json(error);
        }else{

          var query;
          if(emailResults.length>0)
          {

            query ="update email_configuration SET ? where userID='"+userID+"' and orgID='"+orgID+"'",
            values = {
              userID:userID,//Somnath Task-3852, Add userID & OrgID
              orgID:orgID,
              createCampaign:createCampaign,
              editCampaign:editCampaign,
              acceptCampaign:acceptCampaign,
              pauseCampaign:pauseCampaign,
              resumeCampaign:resumeCampaign,
              completeCampaign:completeCampaign,
              rejectCampaign:rejectCampaign,
              counterCampaign:counterCampaign,
              counterAcceptCampaign:counterAcceptCampaign,
              counterRejectCampaign:counterRejectCampaign,
              leadUpload:leadUpload,
              leadReview:leadReview,
              cancelPublisher:cancelPublisher,
              endDatePublisher:endDatePublisher,
              leadsDecrement:leadsDecrement,
              dailyUpdate:dailyUpdate,
              reAllocationCampaign:reAllocationCampaign,
              firstDeliveryDateWarn:firstDeliveryDateWarn,
              firstDeliveryDateCross:firstDeliveryDateCross,
              linkAgencyPublisher:linkAgencyPublisher,
              linkAgencyAdvertiser:linkAgencyAdvertiser,
              acceptCampaignWarn:acceptCampaignWarn,
              voiceLinkUpload:voiceLinkUpload,
              creativesUploadWarn:creativesUploadWarn,
              cancelPublisherCross:cancelPublisherCross,
              updateLeadsPermission:updateLeadsPermission,
              message:message,
              landingPageSubmit:landingPageSubmit,
              creativeReview:creativeReview,
              campaignAllocation:campaignAllocation,
              pocSubmit:pocSubmit,
              csSubmit:csSubmit,
              pocReview:pocReview,
              activeCampaign:activeCampaign,
              reportPublisher:reportPublisher,
              biddingAllocation:biddingAllocation,
              biddingSubmission:biddingSubmission,
              addUser:addUser,
              biddingReview:biddingReview,
              tdrReport:tdrReport,
              pacingAlert:pacingAlert,
              rfpAcknowledgement:rfpAcknowledgement,
              invoiceReviewed:invoiceReviewed,
              clientSetup:clientSetup,
              salesforceNotification:salesforceNotification,
              invoiceReviewAlert:invoiceReviewAlert,
              marketoClientSetup:marketoClientSetup,
              marketoNotification:marketoNotification,
              hubspotClientSetup:hubspotClientSetup,
              hubspotNotification:hubspotNotification,
              rfpFollowupEmail:RFPFollowupEmail, //Sonali-3533-added to send followup mail to commercial agency
              rfpSetupReminder,//Somnath Task-3526, Add rfpSetupReminder in sql
              activeRFP,//Somnath Task-3797, Add activeRFP in sql
              lastUpdated:formatted
        
            };

          }else{
             query = "insert into email_configuration SET ?",
            values = {
              userID:userID,//Somnath Task-3852, Add userID & OrgID
              orgID:orgID,
              createCampaign:createCampaign,
              editCampaign:editCampaign,
              acceptCampaign:acceptCampaign,
              pauseCampaign:pauseCampaign,
              resumeCampaign:resumeCampaign,
              completeCampaign:completeCampaign,
              rejectCampaign:rejectCampaign,
              counterCampaign:counterCampaign,
              counterAcceptCampaign:counterAcceptCampaign,
              counterRejectCampaign:counterRejectCampaign,
              leadUpload:leadUpload,
              leadReview:leadReview,
              cancelPublisher:cancelPublisher,
              endDatePublisher:endDatePublisher,
              leadsDecrement:leadsDecrement,
              dailyUpdate:dailyUpdate,
              reAllocationCampaign:reAllocationCampaign,
              firstDeliveryDateWarn:firstDeliveryDateWarn,
              firstDeliveryDateCross:firstDeliveryDateCross,
              linkAgencyPublisher:linkAgencyPublisher,
              acceptCampaignWarn:acceptCampaignWarn,
              voiceLinkUpload:voiceLinkUpload,
              creativesUploadWarn:creativesUploadWarn,
              cancelPublisherCross:cancelPublisherCross,
              updateLeadsPermission:updateLeadsPermission,
              message:message,
              landingPageSubmit:landingPageSubmit,
              creativeReview:creativeReview,
              campaignAllocation:campaignAllocation,
              pocSubmit:pocSubmit,
              csSubmit:csSubmit,
              pocReview:pocReview,
              activeCampaign:activeCampaign,
              reportPublisher:reportPublisher,
              biddingAllocation:biddingAllocation,
              biddingSubmission:biddingSubmission,
              addUser:addUser,
              biddingReview:biddingReview,
              tdrReport:tdrReport,
              pacingAlert:pacingAlert,
              rfpAcknowledgement:rfpAcknowledgement,
              invoiceReviewed:invoiceReviewed,
              clientSetup:clientSetup,
              salesforceNotification:salesforceNotification,
              invoiceReviewAlert:invoiceReviewAlert,
              created:formatted,
              marketoClientSetup:marketoClientSetup,
              marketoNotification:marketoNotification,
              hubspotClientSetup:hubspotClientSetup,
              hubspotNotification:hubspotNotification,
              rfpFollowupEmail:RFPFollowupEmail, //Sonali-3533-added to send followup mail to commercial agency
              rfpSetupReminder,//Somnath Task-3526, Add rfpSetupReminder in sql
              activeRFP,//Somnath Task-3797, Add activeRFP in sql
              lastUpdated:formatted
        
            };
          }
     
      

     // console.log(+query);
      pool.query(query,values,function(error,results,fields){
          if(error){
            log.error("Error inside emailConfigurationInfo==>"+error);
              return res.status(400).json(error);
          }else{
            log.info("Inside else emailConfigurationInfo");
          
              res.json({ success: true});
          }
      });
    }});
   });

/**
* @author Supriya Gore
* @param  Description fetch email configuration Info
* @return Description return Successfully the info
*/
//Somnath Task-3852, Add authCheck Middleware
router.post('/getEmailConfigurationInfo',authCheck, function(req, res, next) {
  log.info("inside getEmailConfigurationInfo");
  var orgID=req.token.id;//Somnath Task-3852, Get token from request
  var userID=req.token.userID;
  

    var emailQuery = "select * from email_configuration where userID='"+userID+"' and orgID='"+orgID+"'";
    console.log(emailQuery)
    pool.query(emailQuery,function(error,emailResults,fields){
      if(error){
        log.error("Error inside getEmailConfigurationInfo==>"+error);
          return res.status(400).json(error);
      }else{
            res.send(JSON.stringify(emailResults));
            
      }})
    });

    module.exports = router;