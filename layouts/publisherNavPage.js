/* Copyright(c) 2019 APSS Media Pvt. Ltd.
 *  All Rights Reserved
 */
import React from "react";
import Footer from "../layouts/footer";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { logoutUser } from "../login/authentication";
import { withRouter } from "react-router-dom";
import { DropdownMenu, MenuItem, Card } from "react-bootstrap-dropdown-menu";

class PublisherNavigation extends React.Component {
	/**
	 * @author Narendra Phadke
	 * @param  Description handle the logout authentication
	 * @return Description return All details of authentication
	 */
	onLogout(e) {
		e.preventDefault();
		const { isAuthenticated, user } = this.props.auth;
		let data = {
			user: user,
		};
		fetch("users/userLogout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		})
			.then((res) => res.json())
			.then((response) => {})		
			.catch((e)=>console.log(e));//Somnath Task-3943, Handle error in catch block

		this.props.logoutUser(this.props.history);
	}

	onPublisherView() {
		const { user } = this.props.auth;
		
		const pID = user.id;
		window.location.href = "/publisherView?pID=" + pID;
	}

	updateExistLead(e) {
		e.preventDefault();
		const { user } = this.props.auth;
		
		const pID = user.id;
		// window.location.href = "/updateExistingLead?pID=" + pID;
		this.props.history.push("/updateExistingLead",{pID}); //Sandeep-task-3729-VAPT-Publisher side--campaign--all sub menues--URL links-BE
	}

	onHome(e) {
		e.preventDefault();
		
		this.props.history.push("/newPublisherDashboard"); //karan-task-3717-replace query params
	}

	onHome1(e) {
		e.preventDefault();
		
		this.props.history.push("/newPublisherDashboard"); //karan-task-3717-replace query params
	}

	onChangePassword(e) {
		e.preventDefault();
		const { isAuthenticated, user } = this.props.auth;
		this.props.history.push( "/changePassword");   //Priyanka--3944--removed params
		//localStorage.removeItem("activeKey");
	}
	leadDeliveryReport(e) {
		e.preventDefault();
		const { user } = this.props.auth;
		this.props.history.push(`/publisherLeadDeliveryReport`); //Somnath Task-3943, remove pID 
		//window.location.href = "/publisherLeadDeliveryReport?pID=" + user.id;
		//  localStorage.removeItem('activeKey');
	}
	myReport(e) {
		e.preventDefault();
		const { user } = this.props.auth;
		window.location.href = "/publisherMyReport";
	} //snehal-task-3357-Report Engine- Publisher View- My Reports and Agency Delivery Tracking Report
	campaignListPage(e) {
		e.preventDefault();
		const { user } = this.props.auth;
		this.props.history.push("/publisherCampaignList"); //karan-task-3717-replace query params
		//  localStorage.removeItem('activeKey');
	}
	publisherRFPAnalysisPage(e) {
		e.preventDefault();
		const { user } = this.props.auth;
		let pID=user.id;
		// window.location.href = "/publisherRFPAnalysis?pID=" + user.id;
		this.props.history.push("/publisherRFPAnalysis",{pID}); //Sandeep-task-3729-VAPT-Publisher side--campaign--all sub menues--URL links-BE
		//  localStorage.removeItem('activeKey');
	}

	onEmailConfigPublisher(e) {
		e.preventDefault();
		const { isAuthenticated, user } = this.props.auth;
		this.props.history.push("/publisherEmailConfig"); //Priyanka--3944-replace query params
		//localStorage.removeItem("activeKey");
	}

	onAddUser(e) {
		e.preventDefault();
		const { isAuthenticated, user } = this.props.auth;
		this.props.history.push( "/addUserPublisher");//Priyanka--3944--removed params
		//localStorage.removeItem("activeKey");
	}
	pubInfo(e) {
		e.preventDefault();
		const { isAuthenticated, user } = this.props.auth;
		this.props.history.push("/publisherInformation",); //Priyanka--3944--removed params
		//localStorage.removeItem("activeKey");
	}
	getInvoice(e) {
		e.preventDefault();
		const { user } = this.props.auth;
		// window.location.href = "/displayPublisherInvoice?pID=" + user.id;
	    this.props.history.push("/displayPublisherInvoice");//Kiran- task 3732 - publisher side--finance --Invoice-URL links & API-FE
	}
	/**
	 * @author Narendra Phadke
	 * @param  Description handle the ABM upgrade
	 * @return Description return All details of ABM upgrade
	 */
	abmUpgrade(e) {
		window.location.reload();
		window.location.href = "/publisherDomainName";
		localStorage.removeItem("activeKey");
	}
	render() {
		/**
		 * @author Narendra Phadke
		 * @param  Description handle the login authentication
		 * @return Description return All details of authentication
		 */
		const { isAuthenticated, user } = this.props.auth;
		// console.warn("In publisher navPage login"+JSON.stringify(this.props.auth));
		const pID = this.props.auth.id;

		const authLinks = (
			<ul class="navbar-nav navbar-right">
				{user.role === "PC-ACCOUNT" ? (
					""
				) : user.role === "PC" || user.role === "PQA" ? (
					<li class="nav-item">
						<a
							className="abc nav-link"
							style={{ color: "aliceblue" }}
							href="#"
							onClick={this.onHome.bind(this)}>
							{" "}
							<span
								className="glyphicon glyphicon-home"
								style={{ color: "aliceblue" }}></span>
							&nbsp;HOME
						</a>
					</li>
				) : (
					<li class="nav-item">
						<a
							className="abc nav-link"
							style={{ color: "aliceblue" }}
							href="#"
							onClick={this.onHome1.bind(this)}>
							{" "}
							<span
								className="glyphicon glyphicon-home"
								style={{ color: "aliceblue" }}></span>
							&nbsp;HOME
						</a>
					</li>
				)}
				&nbsp;&nbsp;
				{user.role === "PC" || user.role === "PNC" || user.role === "PQA" ? (
					<li class="nav-item dropdown">
						<a
							href="#"
							class="abc nav-link dropdown-toggle dropbtn"
							style={{ color: "aliceblue" }}
							id="navbardrop"
							data-toggle="dropdown">
							CAMPAIGNS
						</a>
						<div class="dropdown-content dropdown-menu">
							<a
								className="dropdown-item"
								href="#"
								onClick={this.campaignListPage.bind(this)}>
								Campaign Progress
							</a>

							{user.role === "PC" ? (
								<a
									className="dropdown-item"
									href="#"
									onClick={this.publisherRFPAnalysisPage.bind(this)}>
									Submitted RFP
								</a>
							) : (
								""
							)}
							{user.role === "PC" ||
							user.role === "PNC" ||
							user.role === "PQA" ? (
								<a
									className="dropdown-item"
									href="#"
									onClick={this.updateExistLead.bind(this)}>
									Update Existing Leads
								</a>
							) : (
								""
							)}
							{/* //shivani-3245-added sub menu as "ABM" Upgrade */}
							<a
								className="dropdown-item "
								href="#"
								onClick={this.abmUpgrade.bind(this)}>
								ABM Upgrade
							</a>
						</div>
					</li>
				) : (
					""
				)}
				{/* &nbsp;&nbsp;
          &nbsp;&nbsp;  
    {user.role==="PC" || user.role==="PNC" ||user.role==="PQA"?
                 <li class="nav-item"><a href="#"  onClick={this.updateExistLead.bind(this)} className="abc nav-link" style={{color:'aliceblue'}} >UPDATE EXIST LEAD</a></li>:''} */}
				&nbsp;&nbsp;
				{user.role === "PC" || user.role === "PNC" || user.role === "PQA" ? (
					<li class="nav-item dropdown">
						<a
							href="#"
							class="abc nav-link dropdown-toggle dropbtn"
							style={{ color: "aliceblue" }}
							id="navbardrop"
							data-toggle="dropdown">
							REPORT
						</a>
						<div class="dropdown-content dropdown-menu">
							{user.role === "PC" ? (
								<a
									className="dropdown-item"
									href="#"
									onClick={this.myReport.bind(this)}>
									My Reports
								</a>
							) : (
								""
							)}
							<a
								className="dropdown-item"
								href="#"
								onClick={this.leadDeliveryReport.bind(this)}>
								Lead Delivery
							</a>
						</div>
					</li>
				) : (
					""
				)}
				{user.role === "PC-ACCOUNT" || user.role === "PC" ? (
					<li class="nav-item dropdown">
						<a
							href="#"
							className="abc nav-link dropdown-toggle dropbtn"
							style={{ color: "aliceblue" }}
							id="navbardrop"
							data-toggle="dropdown">
							FINANCE
						</a>
						<div class="dropdown-content dropdown-menu">
							<a
								className="dropdown-item"
								href="#"
								onClick={this.getInvoice.bind(this)}>
								Invoice
							</a>
						</div>
					</li>
				) : (
					""
				)}
				&nbsp;&nbsp;
				<li class="nav-item dropdown">
					<a
						href="#"
						className="abc nav-link dropdown-toggle dropbtn"
						style={{ color: "aliceblue" }}
						id="navbardrop"
						data-toggle="dropdown">
						<span
							class="	glyphicon glyphicon-cog"
							style={{ color: "aliceblue" }}></span>
						{/* MY ACCOUNT */}
					</a>
					<div class="dropdown-content dropdown-menu">
						<a
							className="dropdown-item"
							href="#"
							onClick={this.onChangePassword.bind(this)}>
							Change Password
						</a>
						{user.role === "PC" ||
						user.role === "PNC" ||
						user.role === "PQA" ? (
							<a
								className="dropdown-item"
								href="#"
								onClick={this.onEmailConfigPublisher.bind(this)}>
								Email Notification
							</a>
						) : (
							""
						)}
						{user.role === "PC" ? (
							<a
								className="dropdown-item"
								href="#"
								onClick={this.onAddUser.bind(this)}>
								Add User
							</a>
						) : (
							""
						)}
						{user.role === "PC" || user.role === "PNC" ? (
							<a
								className="dropdown-item"
								href="#"
								onClick={this.pubInfo.bind(this)}>
								Publisher Information
							</a>
						) : (
							""
						)}
					</div>
				</li>
				&nbsp;&nbsp;
				<li className="nav-item">
					<a
						href="#"
						className="abc nav-link"
						style={{ color: "aliceblue" }}
						onClick={this.onLogout.bind(this)}>
						<span
							className="glyphicon glyphicon-log-out"
							style={{ color: "aliceblue" }}></span>
					</a>
				</li>
			</ul>
		);
		const guestLinks = (
			<ul className="navbar-nav navbar-right">
				<li className="nav-item">
					<Link className="nav-link" to="/userLogin">
						Sign Up
					</Link>
				</li>
			</ul>
		);
		return (
			<div>
				<nav className="navbar navbar-expand-md navbar-dark navbar-fixed-top">
					<img
						src="DemandIntegrateLogo_White.png"
						alt="Demand Integrate"
						height="50px"
						width="200px"></img>
					<button
						class="navbar-toggler"
						type="button"
						data-toggle="collapse"
						data-target="#navbarSupportedContent">
						<span className="navbar-toggler-icon"></span>
					</button>

					<div className="collapse navbar-collapse" id="navbarSupportedContent">
						{user.role === "PC" ? (
							<h5
								style={{
									fontWeight: "10px",
									fontStyle: "bold",
									color: "white",
									textAlign: "right",
								}}>
								Welcome &nbsp;
								<b style={{ color: "#00FF00" }}>
									{user.firstName}&nbsp;{user.lastName}
								</b>{" "}
								- Publisher Commercial
							</h5>
						) : (
							""
						)}
						{user.role === "PNC" ? (
							<h5
								style={{
									fontWeight: "10px",
									fontStyle: "bold",
									color: "white",
									textAlign: "right",
								}}>
								Welcome &nbsp;
								<b style={{ color: "#00FF00" }}>
									{user.firstName} &nbsp;{user.lastName}
								</b>{" "}
								- Publisher Non-Commercial
							</h5>
						) : (
							""
						)}
						{user.role === "PQA" ? (
							<h5
								style={{
									fontWeight: "10px",
									fontStyle: "bold",
									color: "white",
									textAlign: "right",
								}}>
								Welcome &nbsp;
								<b style={{ color: "#00FF00" }}>
									{user.firstName}&nbsp;{user.lastName}
								</b>{" "}
								- Publisher Quality Assurance
							</h5>
						) : (
							""
						)}
						{isAuthenticated ? authLinks : guestLinks}
					</div>
				</nav>

				{/* <br></br>  <br></br><br></br><br></br><br></br>
     <Footer/> */}
			</div>
		);
	}
}
/**
 * @author Narendra Phadke
 * @param  Description handle the login authentication
 * @return Description return All details of authentication
 */
PublisherNavigation.propTypes = {
	logoutUser: PropTypes.func.isRequired,
	auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
	auth: state.auth,
});
export default connect(mapStateToProps, { logoutUser })(
	withRouter(PublisherNavigation)
);
