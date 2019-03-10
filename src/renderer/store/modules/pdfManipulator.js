import PouchDB from 'pouchdb'
import fs from 'fs'
import { join } from 'path'

const state = {
  pdfs: [],
  db: null,
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
  addConfig (state, config) {
    state.config = config
  },
  addDB (state, db) {
    state.db = db
  },
  closeDB (state) {
    state.db = null
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
  addConfig ({ commit }, config) {
    commit('addConfig', config)
  },
  async initDB ({ commit, state }, dbPath) {
    if (state.db == null) {
      if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true })
      commit('addDB', new PouchDB(join(dbPath, 'pdf-files.db')))
    }
    return true
  },
  closeDB ({ commit, state }) {
    if (state.db != null) {
      state.db.close()
      commit('closeDB')
    }
  }
}

export default {
  state,
  mutations,
  actions
}
