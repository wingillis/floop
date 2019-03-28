import worker from '../../../main/lib/worker'
import { flatten, uniq, first } from 'lodash'

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
  addPdf ({ commit, getters }, pdf) {
    if (!getters.ids.includes(pdf._id)) {
      commit('addPdf', pdf)
    }
  },
  async addPdfs ({ commit, getters }, fileData) {
    // TODO: check if pdf is already added
    let toUpdate = fileData.filter(v => {
      return !getters.ids.includes(v._id)
    })
    if (toUpdate.length > 0) {
      commit('addPdfs', toUpdate)
    }
  },
  addConfig ({ commit }, config) {
    commit('addConfig', config)
  },
  async updatePdf ({ commit, state }, data) {
    let doc = await worker.updateFile(data, state.config)
    commit('updatePdf', doc)
  },
  async updateFiles ({ commit, state }) {
    let config = state.config
    let fileData = await worker.processFolder(config)
    let ids = uniq(fileData.map(v => { return v._id }))
    // don't add duplicates if there are any
    let toUpdate = ids.map(v => {
      return first(fileData.filter(x => { return x._id === v }))
    })
    commit('addPdfs', toUpdate)
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
  },
  ids (state) {
    return state.pdfs.map(v => { return v._id })
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
