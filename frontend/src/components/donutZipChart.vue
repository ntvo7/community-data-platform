<template>
  <div class="w-1/2">
    <canvas class="p-10" ref="zipChart"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
//define props (label and chartData)
export default {
  props: {
    label: {
      type: Array
    },
    chartData: {
      type: Array
    }
  },
  mounted() { //uses the data to load the chart's values
    this.chart = new Chart(this.$refs.zipChart, {
      type: 'doughnut',
      data: {
        labels: this.label,
        datasets: [
          {
            borderWidth: 1,
            data: this.chartData // Update this line
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Clients by Zip Code'
          }
        },
        responsive: true,
        maintainAspectRatio: true
      }
    })
  },
  beforeUnmount() {
    // charts stay in memory until they are destroyed
    this.chart.destroy()
  },
}
</script>
