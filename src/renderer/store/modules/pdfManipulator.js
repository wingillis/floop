import PouchDB from 'pouchdb'
import fs from 'fs'
import { join } from 'path'
import worker from '../../../main/lib/worker'

let db = null

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
    let inserts = await db.bulkDocs(fileData)
    let files = await inserts.map(async (v) => {
      let doc = await db.get(v._id)
      return doc
    })
    commit('addPdfs', files)
  },
  addConfig ({ commit }, config) {
    commit('addConfig', config)
  },
  async updatePdf ({ commit, state }, pdf) {
    let doc = await worker.moveToTaggedFolders(pdf, state.config)
    commit('updatePdf', doc)
    db.put(doc)
  },
  async mergeDbWithVuex ({ commit, state }, dbEntries) {
    /* make sure the revisions for each file entry from the database
    and the electron store line up */
  },
  async initDB ({ dispatch }, dbPath) {
    if (db == null) {
      if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true })
      db = new PouchDB(join(dbPath, 'pdf-files.db'))
      // now load the pdfs
      let files = await db.allDocs()
      dispatch('mergeDbWithVuex', files.rows)
    }
    return true
  },
  closeDB (context) {
    if (db != null) {
      db.close()
      db = null
    }
  }
}

export default {
  state,
  mutations,
  actions
}
