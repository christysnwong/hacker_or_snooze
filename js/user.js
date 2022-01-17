"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */

/** [modified by CW] Handle login form submission. If login ok, sets up the user instance */

async function login(evt) {
  console.debug("login", evt);
  evt.preventDefault();

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();

  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.

  try {
    currentUser = await User.login(username, password);

    $loginForm.trigger("reset");

    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();
    location.reload();


  } catch(err) {
    // catch error if username or password is incorrect
    let statusCode = err.response.data.error.status;

    if (statusCode >= 400 || statusCode < 500) {
      alert("Incorrect username/password combination.");
    } else {
      alert("An error has occured.");
    }

  }
  

}

$loginForm.on("submit", login);

/** [modified by CW] Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  // User.signup retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.

  try {
    currentUser = await User.signup(username, password, name);

    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();
    location.reload();

    $signupForm.trigger("reset");

  } catch(err) {
    // catch error if username is already taken or there are other errors
    let statusCode = err.response.data.error.status;


    if (statusCode === 409) {
      alert("Username is already taken. Please select another username");
    } else {
      alert("Bad request / invalid username/password combination.");
    }

  }

  
}

$signupForm.on("submit", signup);

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  localStorage.clear();
  location.reload();
}

$navLogOut.on("click", logout);





/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");

  $allStoriesList.show();

  updateNavOnLogin();
  $loginForm.hide();
  $signupForm.hide();
}

// [CW] Get user's info for user's profile page
function getUserInfo() {
  console.debug("getUserInfo");

  $("#user-name").text(`Name: ${currentUser.name}`);
  $("#user-username").text(`Username: ${currentUser.username}`);
  $("#account-created").text(`Account Created: ${currentUser.createdAt.slice(0, 10)}`);

}

// [CW] shows edit form for user's name when edit-icon is clicked on user's profile page

function showEditUserNameForm(evt) {
  console.debug("showEditUserNameForm");

  $editUserNameForm.removeClass("hidden");
  $editUserNameForm.addClass("inline");

  $editUserNameForm.show();
  

}

$userProfile.on("click", ".edit-profile-user-name", showEditUserNameForm);

// [CW] allows user's to edit his/her name after the edit form for user's name is submitted
async function editUserName(evt) {
  console.debug("editUserName");
  evt.preventDefault();

  const newName = $("#edit-user-name").val();

  const responseMsg = await currentUser.updateUserName(currentUser.username, newName);
  alert(responseMsg);

  currentUser.name = newName;
  getUserInfo();
  
  $editUserNameForm.hide();
  $editUserNameForm.trigger("reset");

}

$editUserNameForm.on("submit", editUserName);

// [CW] allows user to cancel and remove the edit form for user's name
function editUserCancel(evt) {
  console.debug("editUserCancel");

  $editUserNameForm.hide();
  $editUserNameForm.trigger("reset");
  
}

$editUserNameForm.on("click", ".cancel", editUserCancel);


// [CW] add observer to the last element of the story list
// if the page is scrolled to the bottom and shows the last element, it will load more stories

function addObserver() {

  const lastStory = document.querySelector("#all-stories-list").lastChild;

  const observer = new IntersectionObserver(function(entries) {
    if(entries[0].isIntersecting === true) {

      // gets more stories from the API
      getAndShowMoreStories();
    }
      
  }, { threshold: [1] });

  observer.observe(lastStory);

}

  