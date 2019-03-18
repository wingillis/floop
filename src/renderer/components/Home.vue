<template lang="pug">
div
  table.pure-table.pure-table-horizontal
    thead
      tr
        th
          span#title-bar Title
          input(v-model="searchTitle", placeholder="filter titles", type="text")
        th Journal
        th Authors
        th Tags
    tbody
      div(v-if="!isSearching")
        pdf-file(v-for="pdf in pdfs",
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

// TODO: cache Fuse searcher up here somehow

const titleOptions = {
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
    searchableTitle () {
      return new Fuse(this.pdfs, titleOptions)
    },
    searchTitle: {
      get () {
        return this.search
      },
      set (newVal) {
        this.pdfFilter = this.searchableTitle.search(newVal)
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
