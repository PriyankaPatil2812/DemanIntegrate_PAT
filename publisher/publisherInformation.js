/* Copyright(c) 2019 APSS Media Pvt. Ltd.
*  All Rights Reserved
*/

/*@author :Sonali Kalke
*@fileName :publisherInformation.js
 *Desc: Publisher Info  
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { logoutUser } from '../login/authentication';
import { withRouter } from 'react-router-dom';
import Footer from '../layouts/footer';
import PublisherNavigation from "../layouts/publisherNavPage";
import { ThemeConsumer } from 'styled-components';
import { MDBBtn, CardBody } from "mdbreact";
import { FaArrowAltCircleLeft } from "react-icons/fa";
import { Card,Steps,Tooltip } from 'antd';
import { fetch_custom as fetch } from "../../configration/fetch_default_headers"; // Priyanka--3944--added default header

const queryString = require('query-string');

const Swal = require('sweetalert2');


class PublisherInformation extends React.Component {
    constructor() {
        super();
        this.state ={
            publisherContactDetails:[],
            publisherInfo:[],
            PublisherID:'',
            PublisherName:'',
            pID:''
        }
        this.handleEdit=this.handleEdit.bind(this);
    }//end of constructor

    handleEdit(e){
        e.preventDefault();
        const {isAuthenticated,user} = this.props.auth;
        var pID=user.id;
        //alert("campid==="+pID)
        this.props.history.push('/publisherInformationEdit');
      
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
        //Priyanka--3944--removed params passing through data

      this.setState({pID:pID})

        fetch("/publisher/publisherDetails",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            //body:JSON.stringify(data)
        }).then(res=>res.json())
        .then(publisherInfo=>{
            this.setState({publisherInfo:publisherInfo,PublisherName:publisherInfo[0].publisherName,PublisherID:publisherInfo[0].pID})
        }).catch(function (err) {console.log(err)});

      
  
      fetch("/publisher/publisherContactDetails", {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        //body: JSON.stringify(data)
      }).then(res => res.json())
      .then(response=> { 
        this.setState({publisherContactDetails:response});
       // alert("publisherContactDetails"+JSON.stringify(this.state.publisherContactDetails));
        })
   
        }
}// end of componentDidMount


    render() {

        const {user} = this.props.auth;

        return (<div>
                  <PublisherNavigation /> 
        <div class="container-fluid" style={{ paddingTop: '100px' ,paddingBottom:'100px'}}>
           <div class="row">
              <div class="col-md-3">
              <a href={'newPublisherDashboard?pID='+this.state.pID}  style={{color: '#056eb8'}}><FaArrowAltCircleLeft size={32} style={{float:'left'}} title="Back to Dashboard"/></a>

                 </div>
              <div class="col-md-9">
                    {/* //shivani-3240-passed ID for DI label consistency */}
        <label style={{marginLeft:'95px'}}id="labelDI">{this.state.PublisherName}(Publisher ID:{this.state.PublisherID})</label>
      </div>
      </div>
      <br/>
        <div style={{ fontSize: "large", color: "#124E9C", fontWeight: "bold" }}
        >Publisher Information:
        {user.role==="PC"?
        <a><Tooltip title="Edit"><img class="float-right" src="NewEdit.png" style={{height:"20px",width:"20px",float:"right"}} onClick={this.handleEdit}/></Tooltip></a>:''}
        </div>
        <br/>
        {this.state.publisherInfo.map(publisherInfo => {
                  return (
        <div class="row">
         
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Email</label>:&nbsp;&nbsp;{publisherInfo.email}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Website</label>:&nbsp;&nbsp;{publisherInfo.website}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Country Code</label>:&nbsp;&nbsp;{publisherInfo.countryCode}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Phone</label>:&nbsp;&nbsp;{publisherInfo.phone}
            </div>
                
            
        </div>
                  )})}
         {/* end of 1st row */}
         <br/>

       {this.state.publisherInfo.map(publisherInfo => {
                  return (
        <div class="row">
            
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Country</label>:&nbsp;&nbsp;{publisherInfo.country}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>State</label>:&nbsp;&nbsp;{publisherInfo.state}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>City</label>:&nbsp;&nbsp;{publisherInfo.city}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Zip Code</label>:&nbsp;&nbsp;{publisherInfo.zipcode}
            </div>
                
            
        </div>
                  )})}
         {/* end of 2st row*/}
         <br/>  


         {this.state.publisherInfo.map(publisherInfo => {
                  return (
        <div class="row">
            
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Time Zone</label>:&nbsp;&nbsp;{publisherInfo.timezone}
            </div>
           
            <div class="col-xs-9  col-sm-9 col-md-9 col-lg-9">
            <label>Address</label>:&nbsp;&nbsp;{publisherInfo.address}
            </div>
                
            
        </div>
                  )})}
         {/* end of 3st row */}
         <br/>

         
         {this.state.publisherInfo.map(publisherInfo => {
                  return (
        <div class="row">
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Rating</label>:&nbsp;&nbsp;{publisherInfo.rating}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>GDPR Compliance</label>:&nbsp;&nbsp;{publisherInfo.gdprCompliance}
            </div>
         
        </div>
                  )})}
         {/* end of 4th row */}
         <br/>
         <hr/>

         <div style={{ fontSize: "large", color: "#124E9C", fontWeight: "bold" }}
        >Delivery Channel:
        </div>

         <table class='table table-bordered' id="myTable3">
                                <thead >
                                    <tr style={{ height: '35px' }}>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Email</th>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Telemarketing </th>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Display</th>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Programmatic</th>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Social </th>
                                       
                                    </tr>
                                </thead>

                         
                                <tbody>
                                {this.state.publisherInfo.map(publisherInfo => {
                  return (
                                <tr>
                                    <td>{publisherInfo.dcEmail}</td>
                                    <td>{publisherInfo.dcTelemarketing}</td>
                                    <td>{publisherInfo.dcDisplay}</td>
                                    <td>{publisherInfo.dcProgrammatic}</td>
                                    <td>{publisherInfo.dcSocial}</td>
                                   
                                </tr>
                  )})}
                            </tbody>
                            </table>
       


         {/* {this.state.publisherInfo.map(publisherInfo => {
                  return (
        <div class="row">
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Delivery Channel Display</label>:&nbsp;&nbsp;{publisherInfo.dcDisplay}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Delivery Channel Programmatic</label>:&nbsp;&nbsp;{publisherInfo.dcProgrammatic}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Delivery Channel Social</label>:&nbsp;&nbsp;{publisherInfo.dcSocial}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Logo</label>:&nbsp;&nbsp;{publisherInfo.dcTelemarketing}
            </div>
                
            
        </div>
                  )})} */}


         {/* {this.state.publisherInfo.map(publisherInfo => {
                  return (
        <div class="row">
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Delivery Channel Display</label>:&nbsp;&nbsp;{publisherInfo.dcDisplay}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Delivery Channel Programmatic</label>:&nbsp;&nbsp;{publisherInfo.dcProgrammatic}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Delivery Channel Social</label>:&nbsp;&nbsp;{publisherInfo.dcSocial}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Logo</label>:&nbsp;&nbsp;{publisherInfo.logo}
            </div>
                
            
        </div>
                  )})}
         {/* end of 5th row */}
             {user.role==="PNC"?'':
<div>    <br/>
    <hr/>
         <div style={{ fontSize: "large", color: "#124E9C", fontWeight: "bold" }}
        >Publisher Bank Information:
        </div>
        <br/>
         {this.state.publisherInfo.map(publisherInfo => {
                  return (
        <div class="row">
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Bank Number</label>:&nbsp;&nbsp;{publisherInfo.bankName}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Account Number</label>:&nbsp;&nbsp;{publisherInfo.accountNumber}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Account Holder Name</label>:&nbsp;&nbsp;{publisherInfo.accountHolderName}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>IFSC Code</label>:&nbsp;&nbsp;{publisherInfo.ifscCode}
            </div>
                
            
        </div>
                  )})}
         {/* end of 6th row */}
         <br/>

         

         {this.state.publisherInfo.map(publisherInfo => {
                  return (
        <div class="row">
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>PAN Number</label>:&nbsp;&nbsp;{publisherInfo.panNumber}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>GST Number</label>:&nbsp;&nbsp;{publisherInfo.gstNumber}
            </div>
          
            
        </div>
                  )})}
                  <br/>

<hr/> </div>}
                  
         {/* end of 6th row */}
        
         <div style={{ fontSize: "large", color: "#124E9C", fontWeight: "bold" }}
        >Publisher Contact Information:
        </div>
        <br/>

        <table class='table table-bordered' id="myTable3">
                                <thead >
                                    <tr style={{ height: '35px' }}>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Contact Id</th>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;First Name </th>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Last Name</th>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Designation</th>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Email </th>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Country Phone Code</th>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Phone Number</th>
                                        <th style={{ color: '#707070', backgroundColor: ' rgba(126, 127, 129, 0.22)' }}>&nbsp;Role</th>
                                    </tr>
                                </thead>

                         
                                <tbody>
                                {this.state.publisherContactDetails.map(publisherContactDetails => {
                  return (
                                <tr>
                                    <td>{publisherContactDetails.contactID}</td>
                                    <td>{publisherContactDetails.firstName}</td>
                                    <td>{publisherContactDetails.lastName}</td>
                                    <td>{publisherContactDetails.designation}</td>
                                    <td>{publisherContactDetails.email}</td>
                                    <td>{publisherContactDetails.countryPhoneCode}</td>
                                    <td>{publisherContactDetails.phoneNo}</td>
                                    <td>{publisherContactDetails.role}</td>
                                </tr>
                  )})}
                            </tbody>
                            </table>
                            <br/>
        {/* {this.state.publisherContactDetails.map(publisherContactDetails => {
                  return (
        <div class="row">
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Contact Id</label>:&nbsp;&nbsp;{publisherContactDetails.contactID}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>First Name</label>:&nbsp;&nbsp;{publisherContactDetails.firstName}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Last Name</label>:&nbsp;&nbsp;{publisherContactDetails.lastName}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Designation</label>:&nbsp;&nbsp;{publisherContactDetails.designation}
            </div>
                
            
        </div>
                  )})}
         {/* end of 7th row 
         <br/>

         {this.state.publisherContactDetails.map(publisherContactDetails => {
                  return (
        <div class="row">
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Email</label>:&nbsp;&nbsp;{publisherContactDetails.email}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Country Phone Code</label>:&nbsp;&nbsp;{publisherContactDetails.countryPhoneCode}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Phone Number</label>:&nbsp;&nbsp;{publisherContactDetails.phoneNo}
            </div>
            <div class="col-xs-3  col-sm-3 col-md-3 col-lg-3">
            <label>Role</label>:&nbsp;&nbsp;{publisherContactDetails.role}
            </div>
                
            
        </div>
                  )})}
         {/* end of 8th row 
         <br/> */}


        </div>
        {/* end of container */}

  <Footer />

        </div>)
        }
    }// end of class

    /**
       * @author Narendra Phadke
       * @param  Description handle the login authentication
       * @return Description return All details of authentication
       */
      PublisherInformation.propTypes = {
    logoutUser: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired
}

const mapStateToProps = (state) => ({
    auth: state.auth
})


export default connect(mapStateToProps, { logoutUser })(withRouter(PublisherInformation));