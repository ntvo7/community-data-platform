<!-- This view lets the admin add user accounts, change their roles, reset their passwords and delete them. -->
<template>
  <main>
    <!--Header-->
    <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
      User Management
    </h1>

    <div class="px-10 pt-20">
      <!-- Add User form -->
      <!-- @submit.prevent stops the submit event from reloading the page-->
      <form @submit.prevent="submitNewUser">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          <h2 class="text-2xl font-bold">Add User</h2>
          <!-- Username input field -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Username</span>
              <span style="color: #ff0000">*</span>
              <input type="text" autocomplete="off"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="newUser.username" />
            </label>
            <span v-if="v$.newUser.username.$error" class="text-red-500">
              Username must be at least 3 characters
            </span>
          </div>
          <!-- Password input field -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Password</span>
              <span style="color: #ff0000">*</span>
              <input type="password" autocomplete="new-password"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="newUser.password" />
            </label>
            <span v-if="v$.newUser.password.$error" class="text-red-500">
              Password must be at least {{ MIN_PASSWORD_LENGTH }} characters
            </span>
          </div>
          <!-- Role selection -->
          <div class="flex flex-col">
            <label class="block">
              <span class="text-gray-700">Role</span>
              <span style="color: #ff0000">*</span>
              <select
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                v-model="newUser.role">
                <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
              </select>
            </label>
          </div>
        </div>
        <!-- Add User submit button -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          <div></div>
          <div class="mt-5">
            <button class="bg-red-700 text-white rounded" type="submit">Add User</button>
          </div>
        </div>
      </form>
    </div>

    <hr class="mt-10 mb-10" />

    <!-- List of users -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <div class="ml-10">
        <h2 class="text-2xl font-bold">Users</h2>
        <!-- What each role can do -->
        <ul class="mt-4 space-y-2 text-gray-700">
          <li v-for="role in roles" :key="role.value">
            <span class="font-bold">{{ role.label }}:</span> {{ role.description }}
          </li>
        </ul>
      </div>
      <div class="flex flex-col col-span-3 mr-10">
        <table class="min-w-full shadow-md rounded">
          <thead class="bg-gray-50 text-xl">
            <tr>
              <th class="p-4 text-left">Username</th>
              <th class="p-4 text-left">Role</th>
              <th class="p-4 text-left">Reset Password</th>
              <th class="p-4 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-300">
            <tr v-for="account in users" :key="account._id">
              <td class="p-2 text-left">
                {{ account.username }}
                <span v-if="isMe(account)" class="italic text-gray-500">(you)</span>
              </td>
              <!-- Role selection. You cannot change your own role, so there is always an admin. -->
              <td class="p-2 text-left">
                <select
                  class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:opacity-50"
                  :value="account.role" :disabled="isMe(account)"
                  @change="changeRole(account, $event)">
                  <option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option>
                </select>
              </td>
              <!-- Reset password -->
              <td class="p-2 text-left">
                <div class="flex gap-2">
                  <input type="password" autocomplete="new-password" placeholder="New password"
                    class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    v-model="newPasswords[account._id]" @keyup.enter="resetPassword(account)" />
                  <button class="border border-red-700 bg-white text-red-700 rounded disabled:opacity-50"
                    :disabled="!newPasswords[account._id]" @click="resetPassword(account)">
                    Reset
                  </button>
                </div>
              </td>
              <!-- Delete user. You cannot delete your own account. -->
              <td class="p-2 text-right">
                <button v-if="!isMe(account)" class="bg-red-700 text-white rounded"
                  @click="removeUser(account)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import useVuelidate from '@vuelidate/core'
import { required, minLength } from '@vuelidate/validators'
import { useToast } from 'vue-toastification'
import { useLoggedInUserStore } from '../store/loggedInUser'
import { getUsers, createUser, updateUser, deleteUser } from '../api/api'

const toast = useToast()
const loggedInUser = useLoggedInUserStore()

// same minimum as the backend
const MIN_PASSWORD_LENGTH = 8

// the roles, from most to least access
const roles = [
  { value: 'admin', label: 'Main Admin', description: 'everything, including managing users' },
  { value: 'editor', label: 'Authorized User', description: 'creates and edits clients, events and services' },
  { value: 'viewer', label: 'Viewer', description: 'can look at records but not change them' },
]

// all user accounts of the organization
const users = ref([])
// password typed in each row's Reset Password field, by user id
const newPasswords = ref({})
// the Add User form
const newUser = ref({ username: '', password: '', role: 'viewer' })

const rules = {
  newUser: {
    username: { required, minLength: minLength(3) },
    password: { required, minLength: minLength(MIN_PASSWORD_LENGTH) },
  },
}
const v$ = useVuelidate(rules, { newUser })

const isMe = (account) => account._id === loggedInUser.id
const roleLabel = (value) => roles.find((role) => role.value === value)?.label

const loadUsers = async () => {
  try {
    users.value = await getUsers()
  } catch (error) {
    toast.error(error)
  }
}

onMounted(loadUsers)

// method called when the admin adds a user
const submitNewUser = async () => {
  newUser.value.username = newUser.value.username.trim()
  await v$.value.$validate()
  if (v$.value.$error) return

  try {
    const response = await createUser(newUser.value)
    toast.success(response)
    newUser.value = { username: '', password: '', role: 'viewer' }
    v$.value.$reset()
    await loadUsers()
  } catch (error) {
    toast.error(error)
  }
}

// method called when the admin picks a new role for a user
const changeRole = async (account, event) => {
  const role = event.target.value
  try {
    const response = await updateUser(account._id, { role })
    account.role = role
    toast.success(`${response}: ${account.username} is now ${roleLabel(role)}`)
  } catch (error) {
    // put the selection back to the role the user still has
    event.target.value = account.role
    toast.error(error)
  }
}

// method called when the admin resets a user's password
const resetPassword = async (account) => {
  const password = newPasswords.value[account._id]
  if (!password) return
  if (password.length < MIN_PASSWORD_LENGTH) {
    toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    return
  }
  try {
    const response = await updateUser(account._id, { password })
    newPasswords.value[account._id] = ''
    toast.success(`${response} for ${account.username}`)
  } catch (error) {
    toast.error(error)
  }
}

// method called when the admin deletes a user
const removeUser = async (account) => {
  if (!window.confirm(`Delete the account "${account.username}"? This cannot be undone.`)) return
  try {
    const response = await deleteUser(account._id)
    toast.success(response)
    await loadUsers()
  } catch (error) {
    toast.error(error)
  }
}
</script>
