<template lang="pug">
div
  table.pure-table.pure-table-horizontal
    thead
      tr
        th
          span#title-bar Title
          input(v-model="search", @keydown.esc="stopSearch",
                placeholder="filter titles", type="text",
                ref="inputTitleSearch")
        th Journal
        th Authors
        th Tags
    tbody
      pdf-file(v-for="pdf in processedPdfs",
                v-bind:pdf="pdf",
                v-bind:key="pdf._id")
//- if I click on a pdf, open the right sidebar
</template>

<script>
import PDFFile from './Home/PDFFile'
import Fuse from 'fuse.js'
import { mapState } from 'vuex'

// TODO: cache Fuse searcher up here somehow

const titleOptions = {
  keys: ['title']
}

export default {
  name: 'home',
  data () {
    return {
      search: null,
      pdfFilter: []
    }
  },
  methods: {
    stopSearch () {
      this.search = ''
      this.$refs.inputTitleSearch.blur()
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
    processedPdfs () {
      if (this.isSearching) {
        return this.searchableTitle.search(this.search)
      } else {
        return this.pdfs
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
