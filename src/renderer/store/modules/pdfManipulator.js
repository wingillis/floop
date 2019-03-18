import worker from '../../../main/lib/worker'
import { flatten, uniq } from 'lodash'

const state = {
  pdfs: [],
  config: null
}

const mutations = {
  updatePdf (state, pdf) {
    state.pdfs = state.pdfs.map((x) => {
      if (x._id === pdf._id) {
        return pdf
      } else {
        return x
      }
    })
  },
  addPdf (state, pdf) {
    state.pdfs.push(pdf)
  },
  addPdfs (state, pdfs) {
    state.pdfs.push(...pdfs)
  },
  clearPdfs (state) {
    state.pdfs = []
  },
  addConfig (state, config) {
    state.config = config
  }
}

const actions = {
  someAsyncTask ({ commit }) {
    // do something async
    // commit('INCREMENT_MAIN_COUNTER')
  },
  addPdf ({ commit }, pdf) {
    commit('addPdf', pdf)
  },
  async addPdfs ({ commit }, fileData) {
    commit('addPdfs', fileData)
  },
  addConfig ({ commit }, config) {
    commit('addConfig', config)
  },
  async updatePdf ({ commit, state }, pdf) {
    let doc = await worker.moveToTaggedFolders(pdf, state.config)
    commit('updatePdf', doc)
  }
}

const getters = {
  authors (state) {
    return state.pdfs.map(v => {
      return v.authors
    })
  },
  titles (state) {
    return state.pdfs.map(v => {
      return v.title
    })
  },
  journals (state) {
    return state.pdfs.map(v => {
      return v.journal
    })
  },
  uniqueTags (state) {
    let tags = state.pdfs.map(v => {
      return v.tags
    })
    return uniq(flatten(tags))
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
