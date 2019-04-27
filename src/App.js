import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import {
  Stitch,
  AnonymousCredential,
  UserPasswordCredential,
  RemoteMongoClient
} from 'mongodb-stitch-browser-sdk'
import {
  AwsServiceClient,
  AwsRequest
} from 'mongodb-stitch-browser-services-aws'
import BSON from 'bson'

import {
  Header,
  Icon,
  Container,
  Menu,
  Message,
  Button
} from 'semantic-ui-react'

import Login from './components/Login'
import Builder from './components/Builder'
import Upload from './components/Upload'


const pacificoFont = {
  fontFamily: "'Pacifico', cursive"
}

const githubButtonStyle = {
  position: 'fixed',
  margin: '1em',
  top: 0,
  right: 0,
  zIndex: 6
}

const convertImageToBSONBinaryObject = file => {
  return new Promise(resolve => {
    var fileReader = new FileReader()
    fileReader.onload = event => {
      var eventBinary = new BSON.Binary(new Uint8Array(event.target.result))
      resolve(eventBinary)
    }
    fileReader.readAsArrayBuffer(file)
  })
}

class App extends Component {
  constructor(props) {
    super(props)
    this.appId = 'choreolab-itmwp'

    this.state = {
      isAuthed: false,
      email: '',
      entries: []
    }
  }

  componentDidMount = async () => {
    this.client = Stitch.initializeAppClient(this.appId)

    this.mongodb = this.client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas')

    this.aws = this.client.getServiceClient(AwsServiceClient.factory, 'aws')

    const isAuthed = this.client.auth.isLoggedIn

    if (isAuthed) {
      const email = this.client.auth.user.profile.email
      const entries = await this.getEntries()
      this.setState({ isAuthed, email, entries })
    }
  }

  login = async (email, password) => {
    const { isAuthed } = this.state

    if (isAuthed) {
      return
    }
    
    const credential = new UserPasswordCredential(email, password)
    const user = await this.client.auth.loginWithCredential(credential)

    const entries = await this.getEntries()
    this.setState({
      isAuthed: true,
      email,
      entries
    })
  }

  logout = async () => {
    this.client.auth.logout()

    this.setState({ isAuthed: false, email: '', entries: [] })
  }

  getEntries = async () => {
    
    return this.mongodb
      .db('poses')
      .collection('images')
      .find({}, { sort: { ts: 1 } })
      .asArray()
  }

  handleFileUpload = async (file, caption) => {
    if (!file) {
      return
    }

    const saveFileResult = await this.saveFile(file)
    const saveEntryResult = await this.saveEntry(caption, saveFileResult)

  
    const entries = await this.getEntries()
    this.setState({ entries })
    return saveEntryResult
  }

  saveFile = async file => {
    const key = this.client.auth.user.id + "/" + file.name; //'${this.client.auth.user.id}-${file.name}'
    const bucket = 'choreolab-poses'
    const url = 'https://choreolab-poses.s3.amazonaws.com/' + encodeURIComponent(key);

    const bsonFile = await convertImageToBSONBinaryObject(file)

    // AWS S3 Request
    const args = {
      ACL: 'public-read',
      Bucket: bucket,
      ContentType: file.type,
      Key: key,
      Body: bsonFile
    }

    const request = new AwsRequest.Builder()
      .withService('s3')
      .withAction('PutObject')
      .withRegion('us-east-1')
      .withArgs(args)
      .build()

    
    
    const s3Result = await this.aws.execute(request)
    

    return {
      url,
      file: {
        name: file.name,
        type: file.type
      },
      s3: {
        bucket,
        key,
        ETag: s3Result.ETag
      }
    }
  }

  saveEntry = async (caption, s3Data) => {
    // MongoDB Collection Insert
    const collection = this.mongodb.db('poses').collection('images')
    return collection.insertOne({
      owner_id: this.client.auth.user.id,
      owner_email: this.client.auth.user.profile.email,
      ...s3Data,
      caption,
      ts: new Date()
    })
  }
  render() {
    const { isAuthed, email, entries } = this.state
    console.log(entries)
    return (
      <Container style={{ marginTop: '1em' }}>
        <Header as="h1" textAlign="center">
          <Header.Content>
            <Icon name="camera retro" />{' '}
            <span style={pacificoFont}>PicStream</span>
            <Header.Subheader>
              Built using MongoDB Stitch and AWS S3
            </Header.Subheader>
          </Header.Content>
        </Header>
        {isAuthed ? (
          <Container>
            <Menu borderless size="small" stackable>
              <Menu.Item header>Welcome, {email}</Menu.Item>
              <Menu.Item>
                <Upload handleFileUpload={this.handleFileUpload} />
              </Menu.Item>
              <Menu.Item
                position="right"
                content="Logout"
                onClick={this.logout}
              />
            </Menu>
            {entries.length > 0 ? (
              <Builder entries={entries} />
            ) : (
              <Message color="blue" header="No Entries Found ☹️" />
            )}
          </Container>
        ) : (
          <Login loginUser={this.login} />
        )}
        <div style={githubButtonStyle}>
          <Button
            as="a"
            href={`https://github.com/aydrian/workshop-picstream/`}
            icon="github"
            content="Source"
            secondary
            target="_blank"
          />
        </div>
      </Container>
    );
  }
}

export default App;
