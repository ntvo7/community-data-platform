<!-- Footer shown at the bottom of every page: copyright, who is signed in, and a link back to the top. -->
<template>
  <footer class="app-footer mt-16 px-10 py-5 text-sm text-gray-600">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <!-- Copyright -->
      <p>&copy; {{ year }} {{ orgName }}. All rights reserved.</p>

      <!-- Signed-in user and their role -->
      <p v-if="user.isLoggedIn" class="flex items-center gap-1">
        <span class="material-icons text-base text-red-700">account_circle</span>
        Signed in as <span class="font-semibold text-gray-800">{{ user.name }}</span>
        <span class="role-badge">{{ roleLabel(user.role) }}</span>
      </p>
      <p v-else>Not signed in</p>

      <!-- Back to top -->
      <a href="#" class="flex items-center gap-1 text-red-700 hover:underline" @click.prevent="backToTop">
        <span class="material-icons text-base">arrow_upward</span>
        Back to top
      </a>
    </div>
  </footer>
</template>

<script setup>
import { useLoggedInUserStore } from '../store/loggedInUser'
import { roleLabel } from '../roles'

defineProps({
  orgName: { type: String, default: '' },
})

const user = useLoggedInUserStore()
const year = new Date().getFullYear()

const backToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
</script>

<style scoped>
.app-footer {
  background-color: #efecec;
  border-top: 4px solid #c8102e;
}

.role-badge {
  margin-left: 4px;
  padding: 1px 8px;
  border-radius: 9999px;
  background-color: #c8102e;
  color: white;
  font-size: 0.75rem;
}
</style>
