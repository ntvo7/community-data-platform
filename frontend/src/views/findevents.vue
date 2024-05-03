<!-- This view displays a list of events. Users can search for events, and click on an event to be redirected to another component to view that event's details -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        List of Events
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <h2 class="text-2xl font-bold">Search Event By</h2>
        <!-- Displays Event Name or Event Date selection -->
        <div class="flex flex-col">
          <select
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy">
            <option value="Event Name">Event Name</option>
            <option value="Event Date">Event Date</option>
          </select>
        </div>
        <!--Displays event name search field-->
        <div class="flex flex-col" v-if="searchBy === 'Event Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="name" v-on:keyup.enter="handleSubmitForm" placeholder="Enter event name" />
          </label>
        </div>
        <!-- Displays event date search field -->
        <div class="flex flex-col" v-if="searchBy === 'Event Date'">
          <input
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="date" v-model="eventDate" v-on:keyup.enter="handleSubmitForm" />
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div></div>
        <div></div>
        <!--Clear Search button-->
        <div class="mt-5 grid-cols-2">
          <button class="mr-10 border border-red-700 bg-white text-red-700 rounded" @click="loadData" type="submit">
            Clear Search
          </button>
          <!--Search Event button-->
          <button class="bg-red-700 text-white rounded" @click="handleSubmitForm" type="submit">
            Search Event
          </button>
        </div>
      </div>
    </div>

    <hr class="mt-10 mb-10" />
    <!-- Display Found Data -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <!--Table showing List of Events-->
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Events</h2>
        <h3 class="italic">Click table row to view event details</h3>
      </div>
      <div class="flex flex-col col-span-2">
        <table class="min-w-full shadow-md rounded">
          <thead class="bg-gray-50 text-xl">
            <tr>
              <th class="p-4 text-left">Event Name</th>
              <th class="p-4 text-left">Event Date</th>
              <th class="p-4 text-left">Event Address</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-300">
            <tr @click="$router.push({name: 'eventdetails', params: { id: event._id } })"
              v-for="event in events" :key="event._id" class="cursor-pointer"
              :class="{ 'hoverRow': hoverId === event._id }" @mouseenter="hoverId = event._id"
              @mouseleave="hoverId = null">
              <td class="p-2 text-left">{{ event.name }}</td>
              <td class="p-2 text-left">{{ formatDate(event.date) }}</td>
              <td class="p-2 text-left">{{ event.address.line1 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<script setup>
import { getEvents, searchEvents } from '../api/api';
import { useToast } from 'vue-toastification';
import { ref } from 'vue';


const toast = useToast();

const events = ref(null);
const searchBy = ref(null);
const name = ref(null);
const eventDate = ref(null);
const hoverId = ref(null);
const isLoading = ref(false);


const loadData = async () => {

  searchBy.value = null;
  name.value = null;
  eventDate.value = null;


  isLoading.value = true;

  try {
    const response = await getEvents();
    events.value = response;
  } catch (error) {
    toast.error('loadData error', error);
  }
};

const handleSubmitForm = async () => {

  if (searchBy.value === 'Event Name') {
    if (name.value) {
      try {
        const query = {
          searchBy: 'name',
          name: name.value,
        };
        const response = await searchEvents(query);
        events.value = response;
      } catch (error) {
        toast.error('Error searching events', error);
      }
    }

  } else if (searchBy.value === 'Event Date') {
    if (eventDate.value) {
      try {
        const formattedDate = new Date(eventDate.value).toISOString().substring(0, 10);
        const query = {
          searchBy: 'date',
          eventDate: formattedDate,
        };
        const response = await searchEvents(query);
        events.value = response;
      } catch (error) {
        toast.error('Error searching events:', error);
      }
    }
  }
};


const formatDate = (date) => {
  const isoDate = new Date(date);
  const year = isoDate.getUTCFullYear();
  const month = String(isoDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(isoDate.getUTCDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
};
</script>

<!-- <script>
import { getClients, searchClients } from '../api/api'
import { useToast } from 'vue-toastification'


//Notifications
const toast = useToast()


export default {
  data() {
    return {
      //variable to store all clients and their information for the organization
      clients: null,
      // Parameters for search to occur
      searchBy: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      // variable stores the ID of the row that the mouse is currently hovering over (to highlight the row red)
      hoverId: null,
    }
  },
  mounted() {
    // when component is mounted, load the data -
    this.loadData()
  },
  methods: {
    // method called when component is mounted
    async loadData() {
      // Resets all the variables
      this.searchBy = ''
      this.firstName = ''
      this.lastName = ''
      this.phoneNumber = ''


      // get list of clients
      try {
        const response = await getClients();
        this.clients = response;
      } catch (error) {
        toast.error(error)
      }
    },
    // method called when user searches for clients
    async handleSubmitForm() {
      // if user searched by client name
      if (this.searchBy === 'Client Name') {
        if (this.firstName || this.lastName) {
          try {
            const query = {
              searchBy: 'name',
              firstName: this.firstName,
              lastName: this.lastName,
            }
            const response = await searchClients(query)
            this.clients = response;
          } catch (error) {
            toast.error(error)
          }
        }
        // if user searches by client phone number
      } else if (this.searchBy === 'Client Number') {
        if (this.phoneNumber) {
          try {
            const query = {
              searchBy: 'number',
              phoneNumber: this.phoneNumber
            }
            const response = await searchClients(query)
            this.clients = response;
          } catch (error) {
            toast.error(error)
          }
        }
      }
    },
  },
}
</script> -->

<!-- <script setup>
import { getClients, searchClients } from '../api/api';
import { useToast } from 'vue-toastification';
import { ref } from 'vue';


const toast = useToast();


const clients = ref(null);
const searchBy = ref('');
const firstName = ref('');
const lastName = ref('');
const phoneNumber = ref('');
const hoverId = ref(null);

const loadData = async () => {

  searchBy.value = '';
  firstName.value = '';
  lastName.value = '';
  phoneNumber.value = '';

  try {
    const response = await getClients();
    clients.value = response;
  } catch (error) {
    toast.error(error);
  }
};

const handleSubmitForm = async () => {

  if (searchBy.value === 'Client Name') {
    if (firstName.value || lastName.value) {
      try {
        const query = {
          searchBy: 'name',
          firstName: firstName.value,
          lastName: lastName.value,
        };
        const response = await searchClients(query);
        clients.value = response;
      } catch (error) {
        toast.error(error);
      }
    }

  } else if (searchBy.value === 'Client Number') {
    if (phoneNumber.value) {
      try {
        const query = {
          searchBy: 'number',
          phoneNumber: phoneNumber.value,
        };
        const response = await searchClients(query);
        clients.value = response;
      } catch (error) {
        toast.error(error);
      }
    }
  }
};

</script> -->