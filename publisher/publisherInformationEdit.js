/* Copyright(c) 2019 APSS Media Pvt. Ltd.
*  All Rights Reserved
*/

/*@author Sandeep Dhawale
*@fileName :
 *Desc: PublisherInformationEdit
*/

import React from 'react';
import 'antd/dist/antd.css';
import { Tabs } from 'antd';    
//import Header from '../layouts/header1';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { logoutUser } from '../login/authentication';
import { withRouter } from 'react-router-dom';
import PublisherCompanyInformationEdit from "./publisherCompanyInformationEdit";
import PublisherContactInformation from "./publisherContactInformation";
import PublisherGDPRCertificateEdit from "./publisherGDPRCertificateEdit";
import PublisherBankDetailsEdit from "./publisherBankDetailsEdit";
import PublisherNavigation from "../layouts/publisherNavPage";
import Footer from '../layouts/footer';
import { FaArrowAltCircleLeft } from "react-icons/fa";
import { fetch_custom as fetch } from "../../configration/fetch_default_headers"; // Priyanka--3944--added default header
const queryString = require('query-string');

class PublisherInformationEdit extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
          // data: 'Initial data...'
          publisherInfo:[],
          publisherContactDetails:[]
         
        }
        this.callback = this.callback.bind(this);
        this.handleBackButton=  this.handleBackButton.bind(this);
     };
     callback(key) {
        console.log(key);
        //alert("Active Tab:"+key);
      }

      componentDidMount()
      {
          if(!this.props.auth.isAuthenticated) {
              this.props.history.push('/userLogin');
            }
            else{
          //  alert("Login Successful");
      
            //agencyDetails
            
            const {user} = this.props.auth;
           
            var pID=user.id;
       //Priyanka--3944--removed params
            /* let data={
               pID:user.id
             };*/
           // var parsed=queryString.parse(this.props.location.search)
           fetch("/publisher/getGDPRInfoForEdit",{ 
            method:"POST",
            headers:{"Content-Type":"application/json"},        
           // body:JSON.stringify(data)
          }).then(res=>res.json())
          .then(publisherGdprInfo=>{
            //alert("here")
             //alert("publisherGdprInfo===>"+JSON.stringify(publisherGdprInfo))
          }).catch(function (err) {console.log(err)});


            fetch("/publisher/publisherDetails",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
               // body:JSON.stringify(data)
            }).then(res=>res.json())
            .then(publisherInfo=>{
                // alert("publisherDetails"+JSON.stringify(publisherInfo));
                this.setState({publisherInfo:publisherInfo,PublisherName:publisherInfo[0].publisherName,PublisherID:publisherInfo[0].pID})
            }).catch(function (err) {console.log(err)});

            fetch("/publisher/publisherContactDetails", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
              //  body: JSON.stringify(data)
              }).then(res => res.json())
              .then(response=> { 
                   //alert("publisherContactDetails"+JSON.stringify(response));
                this.setState({publisherContactDetails:response});
                 //alert("publisherContactDetails"+JSON.stringify(publisherContactDetails));
                })
    
               
        };
       
        }
       
        handleBackButton(e){
          const {user} = this.props.auth;
          //localStorage.removeItem('invoiceKey');
          window.location.href="/publisherInformation";
        }
    render() {
        const { TabPane } = Tabs;

        return(
                <div>
                     <PublisherNavigation /> 
                     
                    <div class="container-fluid" style={{paddingTop:"100px"}}>
                        <br/>
                        <div>
                        <a> <FaArrowAltCircleLeft size={32} style={{float:'left',color:'#056eb8',paddingBottom:'3px'}} title="Back" onClick={this.handleBackButton} /></a>
                        </div>
                    <div class="row">
                        <div class="col-md-4 col-lg-4">
                        </div>
                       
                        <div class="col-xs-12  col-sm-12 col-md-4 col-lg-4">
                        {/* </div></div><label id="label" style={{ ,marginLeft:"450px"}}>Campaign Allocation</label> */}

                        <span ><h4 style={{textAlign:"center",color:"#056eb8",fontSize:"20px",fontWeight:"bold"}}>Publisher Edit Form</h4></span>
                        
                        </div>
                        
                        <div class=" col-md-4 col-lg-4">
                        </div>
                    </div>
                    {/* End of 1st Row */}
                    <div class="row">
                    <div class="col-xs-12  col-sm-12 col-md-12 col-lg-12">
                        <Tabs onChange={this.callback} type="card">
                        <TabPane tab="Publisher Information" key="1-Company Information">
                        <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12 bgColor">
                         <PublisherCompanyInformationEdit /> 
                        </div>
                        </TabPane>
                        {/* <TabPane tab="Contact Information" key="2-Contact Information">
                        <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12 bgColor">
                         <PublisherContactInformation /> 
                        </div>
                        </TabPane> */}
                        <TabPane tab="Global Compliance" key="3-Global Compliance">
                        <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12 bgColor">
                        <PublisherGDPRCertificateEdit/>
                        </div>
                        </TabPane>
                        <TabPane tab="Bank Details" key="4-Bank Details">
                        <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12 bgColor">
                        <PublisherBankDetailsEdit/>
                        </div>
                        </TabPane>


                        {/* <TabPane tab="Privacy Policy" key="5-Privacy Policy">
                        Content of Tab Pane 5
                        </TabPane> */}
                        </Tabs>
                        </div>
                    </div>
                    {/* End of 2nd Row */}
                    </div>    
               <Footer/>
                </div>
                //Last div
            )}
}

 /**
       * @author Narendra Phadke
       * @param  Description handle the login authentication
       * @return Description return All details of authentication
       */
      PublisherInformationEdit.propTypes = {
        logoutUser: PropTypes.func.isRequired,
        auth: PropTypes.object.isRequired
    }
    
    const mapStateToProps = (state) => ({
        auth: state.auth
    })
    
    
    export default connect(mapStateToProps, { logoutUser })(withRouter(PublisherInformationEdit));