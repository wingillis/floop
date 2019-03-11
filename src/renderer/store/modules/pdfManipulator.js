import PouchDB from 'pouchdb'
import fs from 'fs'
import { join } from 'path'
import worker from '../../../main/lib/worker'

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
  clearPdfs (state) {
    state.pdfs = []
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
  async addPdfs ({ commit, state }, fileData) {
    await state.db.bulkDocs(fileData)
    let files = await state.db.allDocs({include_docs: true})
    commit('clearPdfs')
    commit('addPdfs', files.rows)
  },
  addConfig ({ commit }, config) {
    commit('addConfig', config)
  },
  async updatePdf ({ commit, state }, pdf) {
    let doc = await worker.moveToTaggedFolders(pdf, state.config)
    commit('updatePdf', doc)
    state.db.put(doc)
  },
  async initDB ({ commit, state }, dbPath) {
    if (state.db == null) {
      if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true })
      let db = new PouchDB(join(dbPath, 'pdf-files.db'))
      commit('addDB', db)
      // now load the pdfs
      let files = await db.allDocs({include_docs: true})
      commit('addPdfs', files.rows)
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
