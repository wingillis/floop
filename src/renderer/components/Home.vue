<template lang="pug">
div
  table.pure-table.pure-table-horizontal
    thead
      tr
        th
          span#title-bar Title
          input(v-model="searchStr", placeholder="filter titles", type="text")
        th Journal
        th Authors
        th Tags
    tbody
      pdf-file(v-if="!isSearching",
               v-for="pdf in pdfs",
               v-bind:pdf="pdf.doc",
               v-bind:key="pdf._id")
      div(v-else)
        pdf-file(v-for="pdf in pdfFilter",
                 v-bind:pdf="pdf.doc",
                 v-bind:key="pdf._id")
//- if I click on a pdf, open the right sidebar
</template>

<script>
import PDFFile from './Home/PDFFile'
import Fuse from 'fuse.js'
import { mapState } from 'vuex'

const options = {
  keys: ['doc.title']
}

export default {
  name: 'home',
  data () {
    return {
      search: null,
      pdfFilter: []
    }
  },
  components: { 'pdf-file': PDFFile },
  computed: {
    ...mapState({
      pdfs: state => state.pdfManipulator.pdfs
    }),
    isSearching () {
      return this.search != null && this.search.length !== 0
    },
    searchStr: {
      get () {
        return this.search
      },
      set (newVal) {
        let fuse = new Fuse(this.pdfs, options)
        this.pdfFilter = fuse.search(newVal)
        this.search = newVal
      }
    }
  }
}
</script>

<style lang="scss">
input[type=text] {
  border: 0px;
  font-weight: 200;
}

#title-bar {
  padding-right: 15px;
}
</style>
