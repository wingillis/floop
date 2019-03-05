<template lang="pug">
div
  table.pure-table.pure-table-horizontal
    thead
      tr
        th Title
        th Journal
        th Authors
        th Tags
    tbody
      pdf-file(v-for="pdf in pdfs",
             v-bind:pdf="pdf.doc",
             v-bind:key="pdf._id")
//- if I click on a pdf, open the right sidebar
</template>

<script>
import PDFFile from './Home/PDFFile'

export default {
  name: 'home',
  components: { 'pdf-file': PDFFile },
  data () {
    return {
      pdfs: []
    }
  },
  mounted () {
    this.$electron.ipcRenderer.on('on-load-db', (event, args) => {
      // assume args is the pdfs
      this.pdfs = args
    })
    this.$electron.ipcRenderer.send('load-db')
    this.$electron.ipcRenderer.on('file-update', (event, args) => {
      this.pdfs = args
    })
  }
}
</script>

<style lang="scss">

</style>
