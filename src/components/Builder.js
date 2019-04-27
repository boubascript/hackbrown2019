import React from 'react'
import { Card, Image, Menu, Comment } from 'semantic-ui-react'
import moment from 'moment'
import ml5 from 'ml5';
import P5Wrapper from 'react-p5-wrapper';
import * as posenet from '@tensorflow-models/posenet'; 

const formatDate = date => {
  date = moment(date)
  let str = ''
  if (date.isBefore(moment().add(7, 'days'), 'day')) {
    str = date.fromNow()
  } else if (date.isSame(moment(), 'year')) {
    str = date.format('MMMM D')
  } else {
    str = date.format('MMMM D, YYYY')
  }
  return str.toUpperCase()
}
const imageScaleFactor = 0.5;
const outputStride = 16;
const flipHorizontal = false;

async function estimatePoseOnImage(imageElement) {
    // load the posenet model from a checkpoint
    const net = await posenet.load();
  
    const pose = await net.estimateSinglePose(imageElement, imageScaleFactor, flipHorizontal, outputStride);
  
    return pose;
}

const sketch = function(p) {
    let rotation = 0;
    let img = {
        height:600
    };
    let poseNet;
    let poses = [];

    let width = 600;
    let height = 400;
    p.setup = function () {
      p.createCanvas(width, height, p.WEBGL);
      p.frameRate(1);
    };
    

    p.myCustomRedrawAccordingToNewPropsHandler = (props) => {
      if (props.rotation){
        rotation = props.rotation * Math.PI / 180;
      }
      if(props.url){
        p.loadImage(props.url, img => {
            img = img;
            p.image(img, 0, 0);
            img.size(width,height)
            img.hide();
            poses.push(estimatePoseOnImage(img) );
            console.log(estimatePoseOnImage(img))
          });
        let options = {
            imageScaleFactor: 1,
            minConfidence: 0.1
        }
        
        // assign poseNet
        poseNet = ml5.poseNet(img, options);
        
        // // This sets up an event that listens to 'pose' events
        // poseNet.on('pose', function (results) {
        //     poses = results;
        // });
      }
    };

    // let modelReady = function(){
    //     
    //     poseNet.singlePose(img)
    // }
    
    p.drawKeypoints = function(poses) {
        // Loop through all the poses detected
        for (let i = 0; i < poses.length; i++) {
            // For each pose detected, loop through all the keypoints
            let pose = poses[i].pose;
            for (let j = 0; j < pose.keypoints.length; j++) {
                // A keypoint is an object describing a body part (like rightArm or leftShoulder)
                let keypoint = pose.keypoints[j];
                // Only draw an ellipse is the pose probability is bigger than 0.2
                if (keypoint.score > 0.2) {
                    p.fill(255);
                    p.stroke(20);
                    p.strokeWeight(4);
                    p.ellipse(p.round(keypoint.position.x), p.round(keypoint.position.y), 8, 8);
                }
            }
        }
    }

    // A function to draw the skeletons
    p.drawSkeleton = function(poses) {
        // Loop through all the skeletons detected
        for (let i = 0; i < poses.length; i++) {
            let skeleton = poses[i].skeleton;
            // For every skeleton, loop through all body connections
            for (let j = 0; j < skeleton.length; j++) {
                let partA = skeleton[j][0];
                let partB = skeleton[j][1];
                p.stroke(255);
                p.strokeWeight(1);
                p.line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
            }
        }
    }

    p.draw = function () {
        console.log(estimatePoseOnImage(img))
        if (poses.length > 0) {
            p.image(img, 0, 0);
            p.drawSkeleton(poses);
            p.drawKeypoints(poses);
            p.noLoop(); // stop looping when the poses are estimated
        }
        p.noLoop();
    };


  };



const Post = ({ _id, url, owner_email, ts, caption }) => {
  return (
    <Card>
      <Card.Content>
        <Card.Header>{owner_email}</Card.Header>
      </Card.Content>
        <Image src={url} />
       <P5Wrapper sketch={sketch} url = {url}  />
      <Card.Content>
        <Card.Description>
          <Comment.Group size="small">
            <Comment>
              <Comment.Content>
                <Comment.Author>{owner_email}</Comment.Author>
                <Comment.Text>{caption}</Comment.Text>
              </Comment.Content>
            </Comment>
          </Comment.Group>
        </Card.Description>
      </Card.Content>
      <Card.Content extra>
        <Menu secondary size="mini">
          <Menu.Item fitted>
            <span title={moment(ts).format('dddd, MMMM Do YYYY, h:mm a')}>
              {formatDate(ts)}
            </span>
          </Menu.Item>
        </Menu>
      </Card.Content>
    </Card>
  )
}

const Feed = ({ entries }) => {
  return (
    <Card.Group itemsPerRow={3} stackable>
      {entries.map(entry => {
        //console.log(entry)
        return <Post key={entry._id} {...entry} />
      })}
    </Card.Group>
  )
}

export default Feed




// const sketch = function(p) {
//     let rotation = 0;
//     let img = {
//         height:600
//     };
//     let poseNet;
//     let poses = [];

//     let width = 600;
//     let height = 400;
//     p.setup = function () {
//       p.createCanvas(width, height, p.WEBGL);
//       p.frameRate(1);
//     };
    

//     p.myCustomRedrawAccordingToNewPropsHandler = (props) => {
//       if (props.rotation){
//         rotation = props.rotation * Math.PI / 180;
//       }
//       if(props.url){
//         p.loadImage(props.url, img => {
//             img = img;
//             p.image(img, 0, 0);
//             img.size(width,height)
//             img.hide();
//             poses.push(estimatePoseOnImage(img) );
//             console.log(poses)
//           });
//         let options = {
//             imageScaleFactor: 1,
//             minConfidence: 0.1
//         }
        
//         // assign poseNet
//         poseNet = ml5.poseNet(img, options);
        
//         // // This sets up an event that listens to 'pose' events
//         // poseNet.on('pose', function (results) {
//         //     poses = results;
//         // });
//       }
//     };

//     // let modelReady = function(){
//     //     console.log(typeof(p))
//     //     poseNet.singlePose(img)
//     // }
    
//     p.drawKeypoints = function(poses) {
//         // Loop through all the poses detected
//         for (let i = 0; i < poses.length; i++) {
//             // For each pose detected, loop through all the keypoints
//             let pose = poses[i].pose;
//             for (let j = 0; j < pose.keypoints.length; j++) {
//                 // A keypoint is an object describing a body part (like rightArm or leftShoulder)
//                 let keypoint = pose.keypoints[j];
//                 // Only draw an ellipse is the pose probability is bigger than 0.2
//                 if (keypoint.score > 0.2) {
//                     p.fill(255);
//                     p.stroke(20);
//                     p.strokeWeight(4);
//                     p.ellipse(p.round(keypoint.position.x), p.round(keypoint.position.y), 8, 8);
//                 }
//             }
//         }
//     }

//     // A function to draw the skeletons
//     p.drawSkeleton = function(poses) {
//         // Loop through all the skeletons detected
//         for (let i = 0; i < poses.length; i++) {
//             let skeleton = poses[i].skeleton;
//             // For every skeleton, loop through all body connections
//             for (let j = 0; j < skeleton.length; j++) {
//                 let partA = skeleton[j][0];
//                 let partB = skeleton[j][1];
//                 p.stroke(255);
//                 p.strokeWeight(1);
//                 p.line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
//             }
//         }
//     }

//     p.draw = function () {
//         if (poses.length > 0) {
//             p.image(img, 0, 0);
//             p.drawSkeleton(poses);
//             p.drawKeypoints(poses);
//             p.noLoop(); // stop looping when the poses are estimated
//         }
//         p.noLoop();
//     };


//   };