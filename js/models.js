"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** [CW] Parses hostname out of URL and returns it. */

  getHostName() {
    const link = new URL(this.url);
    return link.hostname;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories(limit) {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    const skip = 0

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
      params: { 
        skip,
        limit
      }

    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));
    
    
    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  // [CW] get more more stories from the API

  async getMoreStories(limit, skip) {
    
    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
      params: { 
        skip,
        limit
      }
    });
   
    // turn plain old story objects from API into instances of Story class
    const moreStories = response.data.stories.map(story => new Story(story));

    this.stories.push(...moreStories);
    
    // build an instance of our own class using the new array of stories
    return new StoryList(this.stories);
  }




  /**  [CW] Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {

    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "POST",
      data: {
        "token": user.loginToken,
        "story": {
          "author" : newStory.author,
          "title" : newStory.title,
          "url" : newStory.url
        }
      }

    });

    const story = new Story(response.data.story);
    this.stories.unshift(story);
    user.ownStories.push(story);
   
    return story;
  }

  // [CW] remove a story on API and HTML
  
  async removeStory(user, storyId) {

    try {
      const response = await axios({
        url: `${BASE_URL}/stories/${storyId}`,
        method: "DELETE", 
        data: {
          "token": user.loginToken
        }
      });
  

      this.stories = this.stories.filter(story => story.storyId !== storyId);
  
      user.ownStories = user.ownStories.filter(story => story.storyId !== storyId);
      user.favorites = user.favorites.filter(story => story.storyId !== storyId);

      return "This story is removed successfully!";

    } catch(err) {
      let statusCode = err.response.data.error.status;

      if (statusCode >= 400 && statusCode < 500) {
        return "Sorry. Story update is unsuccessful.";
      } else {
        return "Errors occured."
      }

    }
    

  }

  // [CW] update a story on API and HTML
  async updateStory(user, story) {
    
    try {
      const response = await axios({
        url: `${BASE_URL}/stories/${story.storyId}`,
        method: "PATCH", 
        data: {
          "token": user.loginToken,
          "story": {
            "author" : story.author,
            "title" : story.title,
            "url" : story.url
          }
        }
      });
      
      
      const edittedStory = new Story(response.data.story);

      const storiesIdx = this.stories.findIndex(s => s.storyId === edittedStory.storyId);
      const ownStoriesIdx = user.ownStories.findIndex(s => s.storyId === edittedStory.storyId);
      const favIdx = user.favorites.findIndex(s => s.storyId === edittedStory.storyId);

      this.stories.splice(storiesIdx, 1, edittedStory);
      user.ownStories.splice(ownStoriesIdx, 1, edittedStory);
      user.favorites.splice(favIdx, 1, edittedStory);

      return "Story update is successful!";

    } catch(err) {
      let statusCode = err.response.data.error.status;

      if (statusCode >= 400 && statusCode < 500) {
        return "Sorry. Story update is unsuccessful.";
      } else {
        return "Errors occured."
      }


    }
    
  }


}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  // [CW] favorite a story on API
  async addFavorite(story) {
    const token = this.loginToken;
    this.favorites.push(story);

    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: "POST",
      data: { token },
    });
  }

  // [CW] unfavorite a story on API
  async removeFavorite(story) {
    const token = this.loginToken;
    this.favorites = this.favorites.filter(s => s.storyId !== story.storyId);

    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: "DELETE",
      data: { token },
    });

  }

  // [CW] Check if each story is favorited
  isFavorite(story) {
    
    return this.favorites.some(s => (s.storyId === story.storyId));
  }

  // [CW] Update a user's name on API
  async updateUserName(username, newName) {
    const token = this.loginToken;

    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "PATCH",
        data: { token , "user": { "name": newName } },
      });

      return "Name is successfully updated!";

    } catch(err) {
      let statusCode = err.response.data.error.status;

      if (statusCode >= 400 && statusCode < 500) {
        return "Bad request";
      
      } else {
        return "Errors occured!";
      }

    }

  }

}
