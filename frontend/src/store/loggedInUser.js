// This pinia store contains state with respect to whether a user is logged in 
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import { loginUser, logoutUser, restoreAuthToken } from '../api/api' // import API calls
import jwt_decode from 'jwt-decode'; // import JSON Web Token decoder to decode the token into the user's information

//Notifications
const toast = useToast()

// Defining a store
export const useLoggedInUserStore = defineStore({
  id: 'loggedInUser',
  state: () => {
    return {
      name: "",
      role: "",
      isLoggedIn: false
    }
  },
  actions: {
    // Keep the user logged in across page reloads, as long as the saved token has not expired
    restoreSession() {
      const token = restoreAuthToken();
      if (!token) return;
      try {
        const decodedToken = jwt_decode(token);
        if (decodedToken.exp * 1000 <= Date.now()) {
          logoutUser();
          return;
        }
        this.$patch({
          isLoggedIn: true,
          role: decodedToken.role,
          name: decodedToken.name
        });
      } catch (error) {
        logoutUser();
      }
    },
    async login(username, password) {
      try {
        const token = await loginUser(username, password);
        // Get the user's name and role from the JWT token
        const decodedToken = jwt_decode(token);
        this.$patch({
          isLoggedIn: true,
          role: decodedToken.role,
          name: decodedToken.name
        });
        // go back to the page that required the login, if there was one
        const redirect = this.$router.currentRoute.value.query.redirect;
        const isLocalPath = typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//");
        this.$router.push(isLocalPath ? redirect : "/");
        toast.success("Login Sucessful!")

      } catch ( error ) {
        toast.error(error.message)
      }
    },
    logout() {
      logoutUser();
      // Reset value after user log out
      this.$patch({
        name: "",
        role: "",
        isLoggedIn: false
      });
      this.$router.push("/");
      toast.info("You have been logged out!")
    }
  },
});
