"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}



// [CW] Show submit form for adding a story on click on "submit"

function navSubmitClick(evt) {
  console.debug("navSubmitClick");
  hidePageComponents();
  $submitStoryForm.show();
  putStoriesOnPage();
}

$navSubmitStory.on("click", navSubmitClick);


// [CW] Show a list of user's favorite stories

function navFavoritesClick(evt) {
  console.debug("navFavoritesClick");
  hidePageComponents();
  $favorites.show();
  putFavoritesListOnPage();
}

$navFavorites.on("click", navFavoritesClick);


// [CW] Show a list of user's own stories

function navMyStoriesClick(evt) {
  console.debug("myStoriesClick");
  hidePageComponents();
  $myStories.show();
  putUserStoriesOnPage();
}

$navMyStories.on("click", navMyStoriesClick);


// [CW] Show user's info

function navUserProfileClick(evt) {
  console.debug("navUserProfile");
  hidePageComponents();
  getUserInfo();
  $userProfile.show();
}

$navUserProfile.on("click", navUserProfileClick);