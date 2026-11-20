<!-- This is the main frontend file. It displays a navigation bar and rendered components. -->
<template>
  <main class="flex flex-row">
    <div id="_container" class="min-h-screen">
      <header class="w-full">
        <section class="text-center">
          <img class="m-auto" src="@\assets\DanPersona.svg" />
        </section>
        <!-- Navigation bar -->
        <nav class="mt-10">
          <ul class="flex flex-col gap-4">
            <!-- Dashboard link -->
            <li>
              <router-link to="/">
                <span style="position: relative; top: 6px" class="material-icons">dashboard</span>
                Dashboard
              </router-link>
            </li>
            <!-- Login link - Link only shows if user is logged out -->
            <li v-if="!user.isLoggedIn">
              <router-link to="/login">
                <span style="position:relative; top: 6px" class="material-icons">login</span>
                Login
              </router-link>
            </li>
            <!-- Logout link - Link only shows if user is logged in -->
            <li v-if="user.isLoggedIn" @click.prevent="logout" style="cursor: pointer;">
              <span style="position:relative; top: 6px" class="material-icons">logout</span>
              Logout
            </li>
            <!-- Client Intake Form link - only shows if user is an editor -->
            <li v-if="user.canEdit">
              <router-link to="/clientform">
                <span style="position: relative; top: 6px" class="material-icons">people</span>
                Client Form
              </router-link>
            </li>
            <!-- Create Event link - only shows if user is an editor -->
            <li v-if="user.canEdit">
              <router-link to="/eventform">
                <span style="position: relative; top: 6px" class="material-icons">event</span>
                Create Event
              </router-link>
            </li>
            <!-- Create Service link - only shows if user is an editor -->
            <li v-if="user.canEdit">
              <router-link to="/serviceform">
                <span style="position: relative; top: 6px" class="material-icons">volunteer_activism</span>
                Create Service
              </router-link>
            </li>
            <!-- Find Client link - only shows if user is logged in -->
            <li v-if="user.isLoggedIn">
              <router-link to="/findclient">
                <span style="position: relative; top: 6px" class="material-icons">search</span>
                Find Client
              </router-link>
            </li>
            <!-- Find Event link - only shows if user is logged in -->
            <li v-if="user.isLoggedIn">
              <router-link to="/findevents">
                <span style="position: relative; top: 6px" class="material-icons">search</span>
                Find Event
              </router-link>
            </li>
            <!-- Find Service link - only shows if user is logged in -->
            <li v-if="user.isLoggedIn">
              <router-link to="/findservice">
                <span style="position: relative; top: 6px" class="material-icons">search</span>
                Find Service
              </router-link>
            </li>
            <!-- User Management link - only shows if user is the admin -->
            <li v-if="user.isAdmin">
              <router-link to="/usermanagement">
                <span style="position: relative; top: 6px" class="material-icons">manage_accounts</span>
                User Management
              </router-link>
            </li>
          </ul>
        </nav>
      </header>
    </div>
    <!-- a column at least as tall as the screen, so the footer sits at the bottom even on short pages -->
    <div class="flex-1 min-w-0 flex flex-col min-h-screen">
      <!-- Organization Name Header -->
      <section class="justify-end items-center h-24 flex" style="background: linear-gradient(250deg, #c8102e 70%, #efecec 50.6%)">
        <h1 class="mr-20 text-3xl text-white"> {{ orgName }}</h1>
      </section>
      <!-- Page Content -->
      <div class="grow">
        <router-view></router-view>
      </div>
      <!-- Footer -->
      <AppFooter :org-name="orgName" />
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { useLoggedInUserStore } from './store/loggedInUser';
import { getOrgName } from './api/api';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import AppFooter from './components/appFooter.vue';

const user = useLoggedInUserStore();
const orgName = ref("Dataplatform");
const toast = useToast();
const router = useRouter();

const logout = () => {
  try {
    user.logout(); // Call the logout action from loggedInUser.js
    router.push('/'); // Navigate to the home page
  } catch (error) {
    toast.error('Logout error', error);
  }
};

const fetchOrgName = async () => {
  try {
    orgName.value = await getOrgName();
  } catch (error) {
    toast.error('Failed to fetch organization name');
  }
};

fetchOrgName();
</script>

<style scoped>
#_container {
  /* same width for every role, wide enough for the longest menu label (User Management) */
  width: 220px;
  flex-shrink: 0;
  background-color: #c8102e;
  color: white;
  padding: 18px;
}
</style>
