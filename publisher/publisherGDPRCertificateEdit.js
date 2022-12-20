/* Copyright(c) 2019 APSS Media Pvt. Ltd.
*  All Rights Reserved
*/

/*@author Snehal More
*@fileName :
 *Desc: Publisher GDPR Edit Certificate Tab
*/



import React from 'react';
import * as $ from "jquery";
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { logoutUser } from '../login/authentication';
import { withRouter } from 'react-router-dom';
import Footer from "../layouts/footer";
import '../agency/loader1.css';//Sandeep-task-2943- code to import loader with Global compliance bcz of loading issue
import 'antd/dist/antd.css';
import {Form,Select,Tooltip,InputNumber,Switch,Radio,Slider,Button,Upload,Icon,Rate,Checkbox,Row,Col,} from 'antd';
import { bake_cookie, read_cookie, delete_cookie } from 'sfcookies';
import { fetch_custom as fetch } from "../../configration/fetch_default_headers"; // Priyanka--3944--added default header

const cookie_key = 'publisherID';
  const Swal = require('sweetalert2');
  const { Option } = Select;
  var assetLength;

  //var gdprAnsArray=[];
  var gdrpResultArray=[];
  var caslResultArray=[];
  var caslDynamicArray=[];
  var gdprnames=[];
  var gdprnames1=[];
  var gdprDynamicArray=[];
  var gdprnames3=[];
  var gdprnames6=[];
  var publisherInfo=[];
  var key=0;
  var inputType=[];
  
 // var pID=localStorage.getItem('pID');
 




class PublisherGDPRCertificateEdit extends React.Component {
  state = { newsuccess:''};

     constructor() {
      super();
      
      this.state = { 
        selected: 'gdpr-2',
        selected1:'casl-2',
        checked: true,
        checked1: false,
        checked2: false,
        checked3:false,
        displayChk1:'',
        displayChk2:'',
        buttonDisplay:'disabled',
        gdprquestionList:[] ,
        publisherInfo:[],
        caslquestionList:[],
        caslquestionListForEdit:[],
        complianceNameList:[],
        varGDPR:'',
        varCASL:'',
        assetsFile:[],
        asseterrors:{},
        gdpr1:{},
        PID:'',

        
        // ansDetails:[{
        //   ans:'',
        //   document:''
        // }],
        gdprDynamicArray:[],
        gdrpResultArray:[],
        caslDynamicArray:[],
        caslResultArray:[],
      };
       this.handleChangeGdprRadio =this.handleChangeGdprRadio.bind(this);
       this.handleChangeGdpr = this.handleChangeGdpr.bind(this);
       this.handleChangeCasl = this.handleChangeCasl.bind(this);
      // this.handleChangeYes =this.handleChangeYes.bind(this);
      // this.handleChangeNo =this.handleChangeNo.bind(this);
      // this.handleChangeGdprFile=this.handleChangeGdprFile.bind(this);
    }


    // componentDidMount()
    // {
    //   alert("ComponentDidmount")
    //   var pID=localStorage.getItem('pID');
    //   alert("PublisherId from Local storage====>"+pID);
    //   if(pID=="")
    //   {
    //     this.setState({
    //       displayChk1:'disabled',
    //       displayChk2:'disabled',
    //       infoMsg:'Please Fill Company Information First'
    //     });
    //   }
    //   else
    //   {
    //     this.setState({
    //       displayChk1:'',
    //       displayChk2:'',
    //       infoMsg:''
    //     });
    //   }
    // } 

/*@author Sonali Kalke
*@fileName :
 *Desc: Get compliance names from backend to display on front-end
*/
  componentDidMount(){
    if(!this.props.auth.isAuthenticated) {
      this.props.history.push('/userLogin');
    }
    else{
  //  alert("Login Successful");

    //agencyDetails
    
    const {user} = this.props.auth;
      var pID=user.id;
   //alert("pid==="+this.state.PID)
   // let data={ pID:pID};      Priyanka--3944--removed params
    //alert("pid==="+pID)
    this.setState({pID:pID});
   
      fetch("/publisher/getGDPRInfoForEdit",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
         // body:JSON.stringify(data)

      }).then(res=>res.json())
      .then(publisherInfo=>{
        if(publisherInfo.length>0){
          //alert("publisherInfo"+JSON.stringify(publisherInfo))
            this.setState({publisherInfo:publisherInfo},
              )
         }
         else{
           //alert("else")
              var publisherInfo=[{docId:"",orgID:'',complianceID:'1',qID:'1',answer:"No",documentName:'',document:'',created:'',lastUpdated:''},
              {docId:"",orgID:'',complianceID:'1',qID:'2',answer:"No",documentName:'',document:'',created:'',lastUpdated:''},
              {docId:"",orgID:'',complianceID:'1',qID:'3',answer:"No",documentName:'',document:'',created:'',lastUpdated:''},
              {docId:"",orgID:'',complianceID:'1',qID:'4',answer:"No",documentName:'',document:'',created:'',lastUpdated:''},
              {docId:"",orgID:'',complianceID:'1',qID:'5',answer:"No",documentName:'',document:'',created:'',lastUpdated:''},
              {docId:"",orgID:'',complianceID:'1',qID:'6',answer:"No",documentName:'',document:'',created:'',lastUpdated:''},
              {docId:"",orgID:'',complianceID:'1',qID:'7',answer:"No",documentName:'',document:'',created:'',lastUpdated:''},
              {docId:"",orgID:'',complianceID:'1',qID:'8',answer:"No",documentName:'',document:'',created:'',lastUpdated:''},
              {docId:"",orgID:'',complianceID:'1',qID:'9',answer:"No",documentName:'',document:'',created:'',lastUpdated:''},
              {docId:"",orgID:'',complianceID:'1',qID:'10',answer:"No",documentName:'',document:'',created:'',lastUpdated:''},
              {docId:"",orgID:'',complianceID:'1',qID:'11',answer:"No",documentName:'',document:'',created:'',lastUpdated:''},
              ];
              this.setState({publisherInfo:publisherInfo})
              //alert("publisherInfo"+JSON.stringify(publisherInfo))
         }

                 }).catch(function (err) {console.log(err)});

    

  }
     
    let data1={compilanceValue:"GDPR" }
    
    //  if(e.target.checked===true && e.target.value==="GDPR"){
       fetch("/publisherOnBoardDetails/getGdprQuestions",{
         method:'POST',
         headers: { "Content-Type": "application/json" },
         body:JSON.stringify(data1)
       }).then(res => res.json())
       .then(gdprquestionList =>{

        
       this.setState({ gdprquestionList: gdprquestionList });
       //alert("ComponentDidMount"+JSON.stringify(gdprquestionList))
      //  console.log(JSON.stringify(gdprquestionList))

         });
    //  }

    // What is use of this api??

   // var pID=localStorage.getItem('pID');
   var pID= read_cookie(cookie_key)
     //alert("PublisherId from Local storage====>"+pID);
      if(pID=="")
      {
        this.setState({
          buttonDisplay:'disabled',
          displayChk1:'disabled',
          displayChk2:'disabled',
          infoMsg:'Please Fill Company Information First'
        });
      }
      else
      {
        this.setState({
          displayChk1:'',
          displayChk2:'',
          buttonDisplay: "button",
          infoMsg:''
        });
      }

    /*  let data={
        orgID:pID,
        role:'PC'
       }/*/

      fetch("/publisherOnBoardDetails/getcomplianceName",{
        method:'POST',
        headers: { "Content-Type": "application/json" },
     // body:JSON.stringify(data)
      }).then(res => res.json())
      .then(complianceNameList =>{
         //alert(JSON.stringify(complianceNameList));
        this.setState({complianceNameList:complianceNameList })
        // alert(JSON.stringify(complianceNameList));
       
  /*@author Sanobar Golandaj
*@fileName :
 *Desc: displaying compliance name on frontend
*/
        var gdpr=(complianceNameList[0].complianceName);
          this.setState({
            varGDPR:gdpr
          });

          var casl=(complianceNameList[1].complianceName);
          this.setState({
            varCASL:casl
          });
          
          });
          }

               // end of compoenetDidMount
/*@author Sonali Kalke
*@fileName :
 *Desc: Fetch values of radio buttons.
*/
 
/*@author Sanobar Golandaj
*@fileName :
 *Desc: handle change for gdpr radio button.
*/
handleChangeGdprRadio(i,e) {
    // alert(JSON.stringify(e.target))
      // const { name, value } = e.target;
      // let gdprDynamicArray = [...this.state.gdprDynamicArray];
      
      // gdprDynamicArray[i] = {...gdprDynamicArray[i], ["answer"]: value};
      // this.setState({ publisherInfo:gdprDynamicArray });

      // this.setState({ 
      //    selected: e.target.value ,
         
      //   });

   // alert(JSON.stringify(e.target))
      const { name, value } = e.target;
      let publisherInfo = [...this.state.publisherInfo];
      
      publisherInfo[i] = {...publisherInfo[i], "answer": value};
      this.setState({selected: e.target.value , publisherInfo });
    
    }
  
/*@author Sanobar Golandaj
*@fileName :
 *Desc: handle change for casl radio button default selected NO.
*/
    handleChangeCaslRadio(i,e) {
        //alert(JSON.stringify(e.target))
      const { name, value } = e.target;
      let caslquestionList = [...this.state.caslquestionList];
      
      caslquestionList[i] = {...caslquestionList[i], "answer": value};
      this.setState({selected: e.target.value , caslquestionList });
    }

/*@author Sonali Kalke
*@fileName :
 *Desc:Fetch GDPR questions from backend.
*/

/*@author Sanobar Golandaj
*@fileName :
 *Desc:handle change for gdpr.
*/
  
    handleChangeGdpr = e => {
      this.setState({
        checked: !this.state.checked
      });
    
      // alert(e.target.checked);
      this.props.form.validateFieldsAndScroll((error,values)=>{
          if(!error){
    
            let data={
             compilanceValue:e.target.value
            }
           
            if(e.target.checked===true && e.target.value==="GDPR"){
              fetch("/publisherOnBoardDetails/getGdprQuestions",{
                method:'POST',
                headers: { "Content-Type": "application/json" },
                body:JSON.stringify(data)
              }).then(res => res.json())
              .then(gdprquestionList =>{

               
              this.setState({ gdprquestionList: gdprquestionList });
              // alert(JSON.stringify(gdprquestionList))
          
                });
            }
        }
    });
  }

 /*@author Sonali Kalke
*@fileName :
 *Desc:store GDPR answers to database.
*/  
 
  handleSubmit = e => {
    //var pID=localStorage.getItem('pID');
    var pID= read_cookie(cookie_key)
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values) => 
    {
      if (!err) {
        

      //           gdrpResultArray=Array.from(new Set(this.state.publisherInfo.map(q=>q.qID))).map(qID=>{

      //  // gdrpResultArray=Array.from(new Set(this.state.gdprDynamicArray.map(q=>q.qID))).map(qID=>{
      //     return{
      //       qID:qID,
      //       question:this.state.gdprDynamicArray.find(q=>q.qID=== qID).question,
      //       complianceName:this.state.gdprDynamicArray.find(q=>q.qID=== qID).complianceName,
      //       complianceID:this.state.gdprDynamicArray.find(q=>q.qID=== qID).complianceID,
      //       answer:this.state.gdprDynamicArray.find(q=>q.qID=== qID).answer,
           
      //     };
      //   });
      //   caslResultArray=Array.from(new Set(this.state.caslquestionList.map(q=>q.qID))).map(qID=>{

      //  // caslResultArray=Array.from(new Set(this.state.caslDynamicArray.map(q=>q.qID))).map(qID=>{
      //     return{
      //       qID:qID,
      //       question:this.state.caslDynamicArray.find(q=>q.qID=== qID).question,
      //       complianceName:this.state.caslDynamicArray.find(q=>q.qID=== qID).complianceName,
      //       complianceID:this.state.caslDynamicArray.find(q=>q.qID=== qID).complianceID,
      //       answer:this.state.caslDynamicArray.find(q=>q.qID=== qID).answer,
           
      //     };
      //   });
      //   alert("gdrpResultArray===>"+JSON.stringify(gdrpResultArray))
    // alert("caslResultArray===>"+JSON.stringify(caslResultArray))

       // alert("pID is"+pID);
       const {user} = this.props.auth;

       var pID=user.id;         

        let data = {
          gdprArray:this.state.publisherInfo,
          caslArray:this.state.caslquestionList,
          //orgID:pID   //Priyanka--3944--removed id from data
        }; 
        // let data = {          
        //   publisherInfo:this.state.publisherInfo,   
        //   caslquestionList:this.state.caslquestionList,       
        //   orgID:pID,
        // };  
         //alert(JSON.stringify(data))
         //alert(JSON.stringify(this.state.publisherInfo));     
         fetch("/publisherOnBoardDetails/gdprAnswersForEdit",{
         // fetch("/publisherOnBoardDetails/updateGDPRInfoForEdit",{
          method:'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
          
        }).then(res=>res.json())
        .then(res=>{
           //alert(JSON.stringify(res))
          console.warn("Response in res in=="+JSON.stringify(res));
          //alert("Response in res in=="+JSON.stringify(res))
            if(res.success===true)
            {
              // alert(a)
              Swal.fire({
           
                type:'success',
                title:'Compliance details submitted successfully !',
              })
              
              this.setState({inputClass: "disabled"})
              // this.setState({newsuccess:a});
             }
       }).catch(function (err) {
          console.log(err)
        });

      }
      else{
        console.log(err);
      }
    });
  }

  
 /*@author Sanobar Golandaj
*@fileName :
 *Desc:handle change for Casl.
*/   
  handleChangeCasl = e => {
       this.setState({
        checked1: !this.state.checked1
      });
          this.props.form.validateFieldsAndScroll((error,values)=>{
          if(!error){
    
            let data={
             compilanceValue:e.target.value,
            // pID:this.state.pID   //Priyanka--3944--removed id from data
            }
           
            if(e.target.checked===true && e.target.value==="CASL"){
              fetch("/publisherOnBoardDetails/getCaslQuestionsForEdit",{
                method:'POST',
                headers: { "Content-Type": "application/json" },
                body:JSON.stringify(data)
              }).then(res=>res.json())
              .then(caslquestionListForEdit =>{
                //alert("data"+JSON.stringify(caslquestionListForEdit))


                if(caslquestionListForEdit.length>0){
                  this.setState({caslquestionList:caslquestionListForEdit})
                   //alert("caslquestionList"+JSON.stringify(caslquestionList))
                
                 }
                 else{
                   //alert("else")
                      var caslquestionListForEdit=[
                      {qID:"12",questions:"CASL question 1 here",complianceName:"CASL",complianceID:2,answer:"No"},
                      {qID:"13",questions:"CASL question 2 here",complianceName:"CASL",complianceID:2,answer:"No"}];
                      this.setState({caslquestionList:caslquestionListForEdit})
                      //alert("caslquestionList"+JSON.stringify(caslquestionList))
                 }
        
                 
              });
            }
        }
    });
  }
    

/*@author Sonali Kalke
*@fileName :
 *Desc: upload GDPR files into database
*/

/*@author Sanobar Golandaj
*@fileName :
 *Desc:handle change for gdpr file,displaying file list on front end.
*/  


 
handleChangeGdprFile(i,e){
 // var pID=localStorage.getItem('pID');
 var pID= read_cookie(cookie_key)
  e.preventDefault();
 
  

  if(i==0)
  {
  //  alert("file handle changed===>"+i);
    var name=e.target.name;
  name.split('#')
  var qID=name[0];
  var complianceID=name[2];
  let gdprFilesData=e.target.files;
  var gdprFilesDataNew=[];
  var duplicategdprList = document.getElementById('duplicategdprList'+qID);
 
  for (var i = 0, l = gdprFilesData.length; i < l; i++) 
    {
      var newItem=gdprFilesData[i].name;

if( gdprnames.indexOf(newItem) === -1)
{
  gdprnames.push(newItem);
  gdprFilesDataNew.push(gdprFilesData[i]);
}
else
{
  duplicategdprList.innerHTML=newItem+" "+"File has already uploaded";
}

      // gdprnames.indexOf(newItem) === -1 ? gdprnames.push(newItem) : duplicategdprList.innerHTML=newItem+" "+"File has already uploaded";
    }
    
   
  var link;
  var filename='';
  var gdprarrayLength=gdprnames.length;
  var nooutputgdpr = document.getElementById('nogdprList'+qID);
  if (gdprarrayLength>0)
  {nooutputgdpr.innerHTML = gdprarrayLength+" Files Selected";}
 else{nooutputgdpr.innerHTML = "0 Files Selected";}
  //  ("Total files"+JSON.stringify(gdprnames));
  var HTML = "<table>";
  for (var j = 0; j < gdprnames.length; j++)
  {// alert("Files to be displayed");
				// User Story - 3427 - Karan Jagtap - changed remove icon
  link= '<a class="removeGdprFile" href="#" data-fileid='+'"'+gdprnames[j]+'"'+'><img src="file_upload_2_blue.png" heigh="18" width="18" style="margin-right:10px"/></a>';
  HTML += "<tr><td style='display:flex;align-items:center;'>"+link+gdprnames[j]+"</td></tr>";
  }
  HTML += "</table>";
  document.getElementById("gdprList"+qID).innerHTML = HTML;
  var orgID=this.state.pID
  $(document).on("click",".removeGdprFile", function(e)
  {// alert("Inside removeGdprFile");
  e.preventDefault();
  var clickedFile =$(this).closest("a").data("fileid");
  var j=0
  for (j=0; j < gdprnames.length; j++)
  {var temp=j;
  //alert("After Click====>"+j+"<===>"+clickedFile);
  if(gdprnames[temp] === clickedFile)
  {
  filename=gdprnames[temp];
  // alert("Deleted File:"+filename+"@"+temp);
  gdprnames.splice(j, 1);
  $(this).parent().remove(); 
  gdprarrayLength=gdprnames.length;
  /**
  * @author Narendra Phadke
  * @param Delete File From Database
  */
  var typeOfSuppDoc="Gdpr";
  let data={
 // orgID:orgID,      //Priyanka--3944--removed user id from data
  qID:qID,
  names:filename,
  complianceID:complianceID
  //typeOfSuppDoc:typeOfSuppDoc
  }
  /*@author Sonali Kalke
*@fileName :
 *Desc:delete files from database.
*/   
  fetch("publisherOnBoardDetails/gdprDocumentDeleteFileUpdate",{
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  //mode:'no-cors',
  //body: data
  body: JSON.stringify(data)
  });
  document.getElementById("gdprfile"+qID).value='';
  if (gdprarrayLength>0)
  {nooutputgdpr.innerHTML = gdprarrayLength+"Files Selected";}
  else{nooutputgdpr.innerHTML = "0 File Selected";
  $("#gdpr").val('');
  var message = document.getElementById('gdprMessage'+qID);
  message.innerHTML = "";
  }
  }// end of if(names[temp] === clickedFile)
  }// end of for
  });//$(document).on
  var data = new FormData(); 
  data.append("qID",qID);
  data.append("orgID",this.state.pID);
  data.append("complianceID",complianceID);
 
  for (var i = 0, l = gdprFilesDataNew.length; i < l; i++) 
  {data.append("file",gdprFilesDataNew[i]);}
  console.warn("newData",data);
  //campaign/supportingDocument
  fetch("publisherOnBoardDetails/supportingDocumentGdprUpdate",{
  method: 'POST',
  body: data
  }).then(function(response) {
  if (response.status >= 400) {
  throw new Error("Bad response from server");
  }
  return response.json();
  }).then(function(response) { 
  // console.log("Return with response");
   }).catch(function(err) {
  console.log(err)
  });
  this.setState({
  files: data
 });
  var msg="Please click on submit button to save data";
  var message = document.getElementById('gdprMessage'+qID);
  var number=document.getElementById("gdprMessage"+qID).innerHTML; 
  if(number=="")
  {
  message.innerHTML += msg;
  }
  }
  else if(i==1)
  {
    //alert("file handle changed===>"+i);
    var name=e.target.name;
  name.split('#')
  var qID=name[0];
  var complianceID=name[2];
  let gdprFilesData=e.target.files;
  var gdprFilesDataNew=[];


  var duplicategdprList = document.getElementById('duplicategdprList'+qID);
  for (var i = 0, l = gdprFilesData.length; i < l; i++) 
  {
    var newItem=gdprFilesData[i].name;

if( gdprnames1.indexOf(newItem) === -1)
{
gdprnames1.push(newItem);
gdprFilesDataNew.push(gdprFilesData[i]);
}
else
{
duplicategdprList.innerHTML=newItem+" "+"File has already uploaded";
}

    // gdprnames.indexOf(newItem) === -1 ? gdprnames.push(newItem) : duplicategdprList.innerHTML=newItem+" "+"File has already uploaded";
}

    
  var link;
  var filename='';
  
  var gdprarrayLength=gdprnames1.length;
  var nooutputgdpr = document.getElementById('nogdprList'+qID);
  if (gdprarrayLength>0)
  {nooutputgdpr.innerHTML = gdprarrayLength+" Files Selected";}
 else{nooutputgdpr.innerHTML = "0 Files Selected";}
  //  ("Total files"+JSON.stringify(gdprnames1));
  var HTML = "<table>";
  for (var j = 0; j < gdprnames1.length; j++)
  {// alert("Files to be displayed");
				// User Story - 3427 - Karan Jagtap - changed remove icon
  link= '<a class="removeGdprFile1" href="#" data-fileid='+'"'+gdprnames1[j]+'"'+'><img src="file_upload_2_blue.png" heigh="18" width="18" style="margin-right:10px"/></a>';
  HTML += "<tr><td style='display:flex;align-items:center;'>"+link+gdprnames1[j]+"</td></tr>";
  }
  HTML += "</table>";
  document.getElementById("gdprList"+qID).innerHTML = HTML;
  var orgID=this.state.pID;
  $(document).on("click",".removeGdprFile1", function(e)
  {// alert("Inside removeGdprFile");
  e.preventDefault();
  var clickedFile =$(this).closest("a").data("fileid");
  var j=0
  for (j=0; j < gdprnames1.length; j++)
  {var temp=j;
  //alert("After Click====>"+j+"<===>"+clickedFile);
  if(gdprnames1[temp] === clickedFile)
  {
  filename=gdprnames1[temp];
  // alert("Deleted File:"+filename+"@"+temp);
  gdprnames1.splice(j, 1);
  $(this).parent().remove(); 
  gdprarrayLength=gdprnames1.length;
  /**
  * @author Narendra Phadke
  * @param Delete File From Database
  */
  var typeOfSuppDoc="Gdpr";
  let data={
  orgID:orgID,
  qID:qID,
  names:filename,
  complianceID:complianceID
  //typeOfSuppDoc:typeOfSuppDoc
  }
  /*@author Sonali Kalke
*@fileName :
 *Desc:delete files from database.
*/   
  fetch("publisherOnBoardDetails/gdprDocumentDeleteFileUpdate",{
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  //mode:'no-cors',
  //body: data
  body: JSON.stringify(data)
  });
  document.getElementById("gdprfile"+qID).value='';
  if (gdprarrayLength>0)
  {nooutputgdpr.innerHTML = gdprarrayLength+"Files Selected";}
  else{nooutputgdpr.innerHTML = "0 File Selected";
  $("#gdpr").val('');
  var message = document.getElementById('gdprMessage'+qID);
  message.innerHTML = "";
  }
  }// end of if(names[temp] === clickedFile)
  }// end of for
  });//$(document).on
  var data = new FormData(); 
  data.append("qID",qID);
  data.append("orgID",this.state.pID);
  data.append("complianceID",complianceID);

  for (var i = 0, l = gdprFilesDataNew.length; i < l; i++) 
  {data.append("file",gdprFilesDataNew[i]);}
  

  // console.warn("newData",data);
  //campaign/supportingDocument
  fetch("publisherOnBoardDetails/supportingDocumentGdprUpdate",{
  method: 'POST',
  body: data
  }).then(function(response) {
  if (response.status >= 400) {
  throw new Error("Bad response from server");
  }
  return response.json();
  }).then(function(response) { 
  // console.log("Return with response");
   }).catch(function(err) {
  console.log(err)
  });
  this.setState({
  files: data
 });
  var msg="Please click on submit button to save data";
  var message = document.getElementById('gdprMessage'+qID);
  var number=document.getElementById("gdprMessage"+qID).innerHTML; 
  if(number=="")
  {
  message.innerHTML += msg;
  }

  }else if(i==3)
  {
 //   alert("file handle changed===>"+i);
    var name=e.target.name;
  name.split('#')
  var qID=name[0];
  var complianceID=name[2];
  let gdprFilesData=e.target.files;
  var gdprFilesDataNew=[];
  var duplicategdprList = document.getElementById('duplicategdprList'+qID);

  for (var i = 0, l = gdprFilesData.length; i < l; i++) 
  {
    var newItem=gdprFilesData[i].name;

if( gdprnames3.indexOf(newItem) === -1)
{
gdprnames3.push(newItem);
gdprFilesDataNew.push(gdprFilesData[i]);
}
else
{
duplicategdprList.innerHTML=newItem+" "+"File has already uploaded";
}

    // gdprnames.indexOf(newItem) === -1 ? gdprnames.push(newItem) : duplicategdprList.innerHTML=newItem+" "+"File has already uploaded";
}
    
  var link;
  var filename='';
  var gdprarrayLength=gdprnames3.length;
  var nooutputgdpr = document.getElementById('nogdprList'+qID);
  if (gdprarrayLength>0)
  {nooutputgdpr.innerHTML = gdprarrayLength+" Files Selected";}
 else{nooutputgdpr.innerHTML = "0 Files Selected";}
  //  ("Total files"+JSON.stringify(gdprnames3));
  var HTML = "<table>";
  for (var j = 0; j < gdprnames3.length; j++)
  {// alert("Files to be displayed");
				// User Story - 3427 - Karan Jagtap - changed remove icon
  link= '<a class="removeGdprFile2" href="#" data-fileid='+'"'+gdprnames3[j]+'"'+'><img src="file_upload_2_blue.png" heigh="18" width="18" style="margin-right:10px"/></a>';
  HTML += "<tr><td style='display:flex;align-items:center;'>"+link+gdprnames3[j]+"</td></tr>";
  }
  HTML += "</table>";
  document.getElementById("gdprList"+qID).innerHTML = HTML;
  var orgID=this.state.pID;
  $(document).on("click",".removeGdprFile2", function(e)
  {// alert("Inside removeGdprFile");
  e.preventDefault();
  var clickedFile =$(this).closest("a").data("fileid");
  var j=0
  for (j=0; j < gdprnames3.length; j++)
  {var temp=j;
  //alert("After Click====>"+j+"<===>"+clickedFile);
  if(gdprnames3[temp] === clickedFile)
  {
  filename=gdprnames3[temp];
  // alert("Deleted File:"+filename+"@"+temp);
  gdprnames3.splice(j, 1);
  $(this).parent().remove(); 
  gdprarrayLength=gdprnames3.length;
  /**
  * @author Narendra Phadke
  * @param Delete File From Database
  */
  var typeOfSuppDoc="Gdpr";
  let data={
  orgID:orgID,
  qID:qID,
  names:filename,
  complianceID:complianceID
  //typeOfSuppDoc:typeOfSuppDoc
  }
  /*@author Sonali Kalke
*@fileName :
 *Desc:delete files from database.
*/   
  fetch("publisherOnBoardDetails/gdprDocumentDeleteFileUpdate",{
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  //mode:'no-cors',
  //body: data
  body: JSON.stringify(data)
  });
  document.getElementById("gdprfile"+qID).value='';
  if (gdprarrayLength>0)
  {nooutputgdpr.innerHTML = gdprarrayLength+"Files Selected";}
  else{nooutputgdpr.innerHTML = "0 File Selected";
  $("#gdpr").val('');
  var message = document.getElementById('gdprMessage'+qID);
  message.innerHTML = "";
  }
  }// end of if(names[temp] === clickedFile)
  }// end of for
  });//$(document).on
  var data = new FormData(); 
  data.append("qID",qID);
  data.append("orgID",this.state.pID);
  data.append("complianceID",complianceID);

  for (var i = 0, l = gdprFilesDataNew.length; i < l; i++) 
  {data.append("file",gdprFilesDataNew[i]);}
  console.warn("newData",data);
  //campaign/supportingDocument
  fetch("publisherOnBoardDetails/supportingDocumentGdprUpdate",{
  method: 'POST',
  body: data
  }).then(function(response) {
  if (response.status >= 400) {
  throw new Error("Bad response from server");
  }
  return response.json();
  }).then(function(response) { 
  // console.log("Return with response");
   }).catch(function(err) {
  console.log(err)
  });
  this.setState({
  files: data
 });
  var msg="Please click on submit button to save data";
  var message = document.getElementById('gdprMessage'+qID);
  var number=document.getElementById("gdprMessage"+qID).innerHTML; 
  if(number=="")
  {
  message.innerHTML += msg;
  }
  }else if(i==6)
  {
   // alert("file handle changed===>"+i);
    var name=e.target.name;
  name.split('#')
  var qID=name[0];
  var complianceID=name[2];
  let gdprFilesData=e.target.files;
  var gdprFilesDataNew=[];
  var duplicategdprList = document.getElementById('duplicategdprList'+qID);
  
  for (var i = 0, l = gdprFilesData.length; i < l; i++) 
  {
    var newItem=gdprFilesData[i].name;

if( gdprnames6.indexOf(newItem) === -1)
{
gdprnames6.push(newItem);
gdprFilesDataNew.push(gdprFilesData[i]);
}
else
{
duplicategdprList.innerHTML=newItem+" "+"File has already uploaded";
}

    // gdprnames.indexOf(newItem) === -1 ? gdprnames.push(newItem) : duplicategdprList.innerHTML=newItem+" "+"File has already uploaded";
}

    
  var link;
  var filename='';
  var gdprarrayLength=gdprnames6.length;
  var nooutputgdpr = document.getElementById('nogdprList'+qID);
  if (gdprarrayLength>0)
  {nooutputgdpr.innerHTML = gdprarrayLength+" Files Selected";}
 else{nooutputgdpr.innerHTML = "0 Files Selected";}
  //  ("Total files"+JSON.stringify(gdprnames6));
  var HTML = "<table>";
  for (var j = 0; j < gdprnames6.length; j++)
  {// alert("Files to be displayed");
				// User Story - 3427 - Karan Jagtap - changed remove icon
  link= '<a class="removeGdprFile3" href="#" data-fileid='+'"'+gdprnames6[j]+'"'+'><img src="file_upload_2_blue.png" heigh="18" width="18" style="margin-right:10px"/></a>';
  HTML += "<tr><td style='display:flex;align-items:center;'>"+link+gdprnames6[j]+"</td></tr>";
  }
  HTML += "</table>";
  document.getElementById("gdprList"+qID).innerHTML = HTML;
  var orgID=this.state.pID;
  $(document).on("click",".removeGdprFile3", function(e)
  {// alert("Inside removeGdprFile");
  e.preventDefault();
  var clickedFile =$(this).closest("a").data("fileid");
  var j=0
  for (j=0; j < gdprnames6.length; j++)
  {var temp=j;
  //alert("After Click====>"+j+"<===>"+clickedFile);
  if(gdprnames6[temp] === clickedFile)
  {
  filename=gdprnames6[temp];
  // alert("Deleted File:"+filename+"@"+temp);
  gdprnames6.splice(j, 1);
  $(this).parent().remove(); 
  gdprarrayLength=gdprnames6.length;
  /**
  * @author Narendra Phadke
  * @param Delete File From Database
  */
  var typeOfSuppDoc="Gdpr";
  let data={
  orgID:orgID,
  qID:qID,
  names:filename,
  complianceID:complianceID
  //typeOfSuppDoc:typeOfSuppDoc
  }
  /*@author Sonali Kalke
*@fileName :
 *Desc:delete files from database.
*/   
  fetch("publisherOnBoardDetails/gdprDocumentDeleteFileUpdate",{
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  //mode:'no-cors',
  //body: data
  body: JSON.stringify(data)
  });
  document.getElementById("gdprfile"+qID).value='';
  if (gdprarrayLength>0)
  {nooutputgdpr.innerHTML = gdprarrayLength+"Files Selected";}
  else{nooutputgdpr.innerHTML = "0 File Selected";
  $("#gdpr").val('');
  var message = document.getElementById('gdprMessage'+qID);
  message.innerHTML = "";
  }
  }// end of if(names[temp] === clickedFile)
  }// end of for
  });//$(document).on
  var data = new FormData(); 
  data.append("qID",qID);
  data.append("orgID",this.state.pID);
  data.append("complianceID",complianceID);
  for (var i = 0, l = gdprFilesDataNew.length; i < l; i++) 
  {data.append("file",gdprFilesDataNew[i]);}
  console.warn("newData",data);
  //campaign/supportingDocument
  fetch("publisherOnBoardDetails/supportingDocumentGdprUpdate",{
  method: 'POST',
  body: data
  }).then(function(response) {
  if (response.status >= 400) {
  throw new Error("Bad response from server");
  }
  return response.json();
  }).then(function(response) { 
  // console.log("Return with response");
   }).catch(function(err) {
  console.log(err)
  });
  this.setState({
  files: data
 });
  var msg="Please click on submit button to save data";
  var message = document.getElementById('gdprMessage'+qID);
  var number=document.getElementById("gdprMessage"+qID).innerHTML; 
  if(number=="")
  {
  message.innerHTML += msg;
  }
  }

  
  }// end of handleChangeGdprFile(i,e)

  render() {
    var pID= read_cookie(cookie_key)
     //alert("PublisherId from Local storage====>"+pID);
      if(pID=="")
      {
        this.state.buttonDisplay='';
        this.state.displayChk1='';
        this.state.displayChk2='';
        this.state.infoMsg='Please Fill Company Information First';
      }
      else
      {
        this.state.buttonDisplay='';
        this.state.displayChk1='';
        this.state.displayChk2='';
        this.state.infoMsg='';
      }

      const { getFieldDecorator } = this.props.form;
      const formItemLayout = {
        labelCol: { span: 6 },
        wrapperCol: { span: 14 },
      };
     
      this.state.gdprquestionList.forEach((itm, i) => {
        this.state.gdprDynamicArray.push(Object.assign({}, itm));
      });

     
      this.state.caslquestionList.forEach((itm, i) => {
        this.state.caslDynamicArray.push(Object.assign({}, itm));
      });


//console.log("Dynamic array is:"+JSON.stringify(this.state.gdprDynamicArray));
/*@author Sanobar Golandaj
*@fileName :
 *Desc:display table for Gdpr on gdpr handle change
 */
      const content = this.state.checked 
    	? 
    <div class="table-responsive-lg">
        <table id="myTable" className=" table table-bordered table-striped">
            <thead>
              <tr style={{backgroundColor:'#909394',color:'white'}}>
                  <th>GDPR Requirement Questionnaire:
                   </th>
                  <th>Details</th>
                  <th>Associated Document</th>
           </tr>
            </thead>
            <tbody >
             
            {this.state.gdprquestionList.map((gdprquestionList,i)=>{if(this.state.gdprquestionList[0].complianceName="true"){ return(
                <tr>
                  <td><label class="word-wrap">{gdprquestionList.questions}
                  {(gdprquestionList.qID==3)? <Tooltip title= "Opt-In-process">
                              <Icon type="question-circle-o" />
                            </Tooltip>:" "}

                   {(gdprquestionList.qID==4)? <Tooltip title= "Provide the link of privacy policy">
                              <Icon type="question-circle-o" />
                            </Tooltip>:" "}  

                  {(gdprquestionList.qID==7)? <Tooltip title= "Training types and frequency">
                              <Icon type="question-circle-o" />
                            </Tooltip>:" "}
                          
                  {(gdprquestionList.qID==8)? <Tooltip title= "Email id of DPO">
                              <Icon type="question-circle-o" />
                            </Tooltip>:" "}


                  </label>
                </td> 
                
                  <td>                  
                    <Radio.Group >          
                  <Radio value="Yes" id="gdpr-1" checked={this.state.publisherInfo[i].answer === 'Yes'} onChange={this.handleChangeGdprRadio.bind(this, i)}>Yes
                 </Radio>
            
                   <Radio value="No" id="gdpr-1"  checked={this.state.publisherInfo[i].answer === 'No'} onChange={this.handleChangeGdprRadio.bind(this, i)}>No</Radio>
                   
                 </Radio.Group>
               </td>
                
            
               
               
               
              {/* <td>{(this.state.selected === 'gdpr-1')?"hell":"234"}
              </td> */}
               
               {/* {gdprquestionList.qID} */}
               <td style={{width:'380px'}}>{(gdprquestionList.suppDoc)=="Yes"?<div>
                 
                 <input type="file" style={{ color: 'transparent' }} id={"gdprfile"+gdprquestionList.qID} name={gdprquestionList.qID+"#"+gdprquestionList.complianceID}
               onChange={this.handleChangeGdprFile.bind(this,i)}
                multiple ></input>
                <div>
                  
                  <div>    
                  {this.state.publisherInfo[i].documentName === null  ||this.state.publisherInfo[i].documentName === ""  ?                         
                  <div id={"nogdprList"+gdprquestionList.qID}>0 file Selected </div> 
                :<div id={"nogdprList"+gdprquestionList.qID}>Uploaded file:{this.state.publisherInfo[i].documentName}</div> }
                                         <div id={"duplicategdprList"+gdprquestionList.qID}style={{color:'red'}} className="word-wrap"></div>
                                                             <div id={"gdprList"+gdprquestionList.qID} className="word-wrap"></div>
                                                            
                     
                                                             <div id={"gdprMessage"+gdprquestionList.qID} style={{color:'green'}}></div></div>
                  
                  </div></div>:" "}</td>
               </tr>
                 
         )
          }
       }
         )} 

              </tbody>
              </table>
            
    </div>
        : null;

  
      
  /*@author Sanobar Golandaj
*@fileName :
 *Desc:display table for Casl on casl handle change
 */  
       const content1 = this.state.checked1
    	? <div class="table-responsive-lg">
      <table id="myTable" className=" table table-bordered table-striped">
          <thead>
            <tr style={{backgroundColor:'#909394',color:'white'}}>
                <th>CASL Requirement Questioanire:</th>
                <th style={{width:'425px'}}>Details</th>
                {/* <th>browse</th> */}
         </tr>
          </thead>
          <tbody >
          {this.state.caslquestionList.map((caslquestionList,i) =>{if(this.state.caslquestionList[0].complianceName="true"){ return(
                <tr>
                  <td><label class="word-wrap">{caslquestionList.questions}</label></td>
                  <td><Radio.Group >
                   <Radio value="Yes" id="gdpr-2" checked={this.state.caslquestionList[i].answer ==='Yes'}  onChange={this.handleChangeCaslRadio.bind(this, i)}>Yes</Radio>
                   <Radio value="No" id="gdpr-2" checked={this.state.caslquestionList[i].answer === 'No'}  onChange={this.handleChangeCaslRadio.bind(this, i)}>No</Radio>
                 </Radio.Group></td>
              </tr>
            )
          }
        }
           )}
          </tbody>
        </table>
  </div>
      : null;
    

      

      return  (
        <div>
      
      <div class="container-fluid" style={{paddingBottom:'60px'}}>
        <div style={{ fontSize: '22px', color: 'green',paddingLeft:'490px'}}>{this.state.newsuccess}</div>
        <Form {...formItemLayout} onSubmit={this.handleSubmit}>
        <Form.Item label="Compliance" >
            {getFieldDecorator('checkbox-group', {
              initialValue: ['A', 'B']
            })(
              
              // <Checkbox.Group style={{ width: '100%' }} >
                  <Row>
            {this.state.complianceNameList.map((complianceNameList)=>{if(complianceNameList.complianceName=="GDPR"){ return(

                <Col span={8}>
                          <Checkbox  value={this.state.varGDPR} name="GDPR" disabled={this.state.displayChk1} checked={ this.state.checked} onChange={ this.handleChangeGdpr }>{complianceNameList.complianceName}</Checkbox>
                      </Col>

                 )}})}
                      {this.state.complianceNameList.map((complianceNameList)=>{if(complianceNameList.complianceName=="CASL"){ return(
                      <Col span={8}>
                     <Checkbox  value={this.state.varCASL} name="CASl" disabled={this.state.displayChk2} checked1={ this.state.checked1} onChange={ this.handleChangeCasl}>{complianceNameList.complianceName}</Checkbox>
                    </Col>  
                 )}})}

                 </Row>
                
              //  </Checkbox.Group>,
              
            )}
          </Form.Item>

   
{content}
{content1}

<Form.Item wrapperCol={{ span: 12, offset: 6 }}>
            <Button type="primary" htmlType="submit"
             className={this.state.buttonDisplay}
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
        </div>
        <Footer/>
        </div>
      );
    }
  }
  /**
       * @author Narendra Phadke
       * @param  Description handle the login authentication
       * @return Description return All details of authentication
       */
      PublisherGDPRCertificateEdit.propTypes = {
        logoutUser: PropTypes.func.isRequired,
        auth: PropTypes.object.isRequired
    }

    const mapStateToProps = (state) => ({
        auth: state.auth
    })
    const publisherRegistrationForm3 = Form.create({ name: 'register' })(PublisherGDPRCertificateEdit);
export default connect(mapStateToProps, { logoutUser })(withRouter(publisherRegistrationForm3));
 

  

//   const publisherRegistrationForm3 = Form.create({ name: 'register' })(PublisherGDPRCertificate);

//   export default publisherRegistrationForm3;

 