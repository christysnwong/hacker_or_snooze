"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;
let storyLimit = 10;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories(storyLimit);
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

// [CW] get and show more story entries 

async function getAndShowMoreStories() {
  console.debug("getAndShowMoreStories");

  const skipEntries = storyList.stories.length;
  
  storyList = await storyList.getMoreStories(storyLimit, skipEntries);

  if (skipEntries === storyList.stories.length) {

    alert(`There are only a total of ${storyList.stories.length} stories. No more stories to show.`);
    return;
  }

  $storiesLoadingMsg.remove();

  alert(`Loading the next ${storyLimit} stories...`);

  putStoriesOnPage();
}


/** [modified by CW]
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false, showEditBtn = false) {
  console.debug("generateStoryMarkup");

  const hostName = story.getHostName();

  const showStar = Boolean(currentUser);

  // delete btn and edit btn are disabled by default on the main page, only enabled on my stories page
  return $(`
      <li id="${story.storyId}">
        ${showDeleteBtn ? getDeleteBtnHTML() : ""}
        ${showStar ? getStarHTML(story, currentUser) : ""}
        ${showEditBtn ? getEditBtnHTML() : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

// [CW] Add html markup for trash can icon (deletebtn) on my stories page only when user is logged in

function getDeleteBtnHTML() {
  return `
  <span class="trash-can">
    <i class="fas fa-trash-alt"></i>
  </span>`;

}

// [CW] Add html markup for star icon (favorite) on any pages when user is logged in

function getStarHTML(story, user) {

  // check if the story is favorite or not
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";

  return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}

// [CW] Add html markup for edit icon on my stories page only when user is logged in
function getEditBtnHTML() {
  
  return `
  <span class="edit-pen">
  <i class="far fa-edit"></i>
  </span>`; 
} 

/** [modified by CW] Gets list of stories from server, generates their HTML, and puts on page. */
// also adds observer to the last element of the story list.

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
  
  // add an observer to last element of the story list. 
  // if the page is scrolled to the bottom and shows last element, it will load more stories
  addObserver();

}

// [CW] Submit new story to API, add story to user's storylist, and create an entry on HTML

async function submitNewStory(evt) {
  console.debug("submitNewStory");
  evt.preventDefault();

  // grab the author, title, and url
  const author = $("#story-author").val();
  const title = $("#story-title").val();
  const url = $("#story-url").val();
  const username = currentUser.username;

  // add new story to story list
  let story = await storyList.addStory(currentUser, { title, author, url, username } )
  
  // regenerate the list of stories on the page
  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  // $myStories.prepend($story);

  // putUserStoriesOnPage();
  // putStoriesOnPage();

  $submitStoryForm.slideUp("slow");
  $submitStoryForm.trigger("reset");

}

$submitStoryForm.on("submit", submitNewStory);

// [CW] Edit an existing story which is selected for editting

function getOrgStoryData(evt) {
  console.debug("getOrgStoryData");

  // get original story's info
  const storyId = $(evt.target).closest("li").attr("id");
  const author = $(evt.target).parent().siblings(".story-author").text();
  const title = $(evt.target).parent().siblings("a").text().trim();
  const url = $(evt.target).parent().siblings("a").attr("href");

  // populate original story info in the edit story form
  $("#edit-story-id").val(storyId);
  $("#edit-story-author").val(author);
  $("#edit-story-title").val(title);
  $("#edit-story-url").val(url);

}


// [CW] Show the edit story form when edit btn is clicked for that story

function showEditStoryForm(evt) {
  console.debug("showEditStoryForm");

  // gather original story's info
  getOrgStoryData(evt);

  $editStoryForm.show();

}

$myStories.on("click", ".edit-pen", showEditStoryForm);


// [CW] Gather editted story's info from the edit story form, send request to API, refresh the page

async function editStoryData(evt) {
  console.debug("getDataToUpdateStory");
  evt.preventDefault();

  // gather info from the edit form
  const storyId = $("#edit-story-id").val();
  const author = $("#edit-story-author").val();
  const title = $("#edit-story-title").val();
  const url = $("#edit-story-url").val();
  
  // submit to API
  let responseMsg = await storyList.updateStory(currentUser, { storyId, title, author, url } );
  alert(responseMsg);

  // refresh the my stories page
  putUserStoriesOnPage();

  $editStoryForm.slideUp("slow");
  $editStoryForm.trigger("reset");  

}

$editStoryForm.on("submit", editStoryData);


// [CW] Put user's favorite stories on favorites page

function putFavoritesListOnPage() {
  console.debug("putFavoritesListOnPage");

  $favorites.empty();

  if (currentUser.favorites.length === 0) {
    $favorites.text("No favorites added yet!");
  }

  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $favorites.prepend($story);

  }

  $favorites.show();

}

// [CW] Add / remove favorite 

async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  if ($(evt.target).hasClass("fas")) {
    await currentUser.removeFavorite(story);
    $(evt.target).toggleClass("fas far");
  } else {
    await currentUser.addFavorite(story);
    $(evt.target).toggleClass("fas far");
  }
 
}

$storiesLists.on("click", ".star", toggleStoryFavorite);


// [CW] Put user's stories on page

function putUserStoriesOnPage() {
  console.debug("putUserStoriesOnPage");

  $myStories.empty();

  if (currentUser.ownStories.length === 0) {
    $myStories.text("No stories added by user yet!");
  }

  for (let story of currentUser.ownStories) {
    const $story = generateStoryMarkup(story, true, true);
    $myStories.prepend($story);

  }
 
  $myStories.show();

}

// [CW] Delete user's story on "my stories page"

async function deleteStory(evt) {
  console.debug("deleteStory");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");
  
  const responseMsg = await storyList.removeStory(currentUser, storyId);
  alert(responseMsg);

  $closestLi.remove();

}

$myStories.on("click", ".trash-can", deleteStory);