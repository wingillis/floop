<template lang="pug">
div
  pdf-file(v-for="pdf in pdfs",
           v-bind:pdf="pdf",
           v-bind:key="pdf._id")
</template>

<script>
import PDFFile from './Home/PDFFile'

export default {
  name: 'home',
  components: { PDFFile },
  data () {
    return {
      thing: 'ready?',
      pdfs: []
    }
  },
  mounted () {
    this.$electron.ipcRenderer.on('on-load-db', (event, args) => {
      this.thing = 'loaded!'
    })
    this.$electron.ipcRenderer.send('load-db')
  }
}
</script>
