![Midwife's Notebook, an offline first client management app](https://raw.githubusercontent.com/DavidASix/midwifes-notebook/refs/heads/main/apps/web/public/og-image.png)

# Midwife Assist | A Mobile App for Midwives.
Client tracking & Pregnancy calculation, all done offline

## Install

#### Install from [Play Store](https://play.google.com/store/apps/details?id=com.dave6.www.midwifeassist)
[<img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
    alt="Get it on Play Store"
    height="80">](https://play.google.com/store/apps/details?id=com.dave6.www.midwifeassist)

## Feature Requests
Do you have a great idea for a new feature? Reach out [by clicking here](mailto:developer@davidasix.com?subject=Midwife%%20Assist) and tell me all about it!

Thanks for reading, keep up the great Midwifery!

## Overview

In late 2021 my then fiancée (now wife) officially began her career as a midwife. Something that she quickly came to realize is that there is a large gap in the market when it comes to Android mobile apps for midwives. There were some solutions on iPhone, but none available for her Pixel.
While I'm sure it wasn't her intention (or perhaps it was) that set me down the path of creating Midwife Assist, an app for Midwives.

My wife detailed that she would like an app which allows her to track patient information, and complete common calculations that come with midwifery (for instance, the estimated birth date, based on last menstrual period). This essential came down to an advanced "contacts" app, with special fields to hold birth information. 
In addition, a clean customized calculator to quickly uncover birth information. Atop the base functionality, the app also needed to have a heavy focus on security, specifically adherence to the PHIPA data handling guidelines.

### Design 📱
The app has gone through a few iterations changing the functionality, feel, and style. In the most recent version at time of writing (3.1) the app navigation has a focus on gesture navigation. Once on a screen (ie calculator, client) you can navigate through the screen options with swipe gestures.
I've paired the swipe gestures with a curved line style for all borders and edges. This is to evoke a calming feeling, and mirror the curves in the logo.

### Security 🔐
There are two main concerns when it comes to security of personal health information for this app.
* Data in Transit
* Data on Device

Data in transit refers to any time data leaves the device, whereas data on device refers to how accessible the data is on the device.

#### Data in Transit
To ensure compliance with all likely laws of data governance, the app __cannot__ connect to the internet. This was done intentionally to ensure data cannot leave the app to be copied elsewhere, potentially opening me up for legal issues. Now unfortunately this does come with some draw back, the main being that the data cannot be backed up when changing devices.
I've consulted this issue with some midwives, and they have agreed that it's worth the trade-off given the safety implications, and given that their client relationships only last a short period of time, so long term storage of records isn't required.
I'd like to address the backup issue by introducing the functionality of outputting an encrypted .midwife file, which could be imported with a password on a different device.
The other downside to not having network connectivity is it severely limits the options for monetization, but I'm alright with that as this is first and fore-most a passion project for my wife.

#### Data on Device
In Ontario Canada, law requires any personal health information held by healthcare works be secured by industry standard methods. To assist with that I've implemented multiple security options. Users can choose between
* Biometric Security
* 4 Digit Pin
* No security

After completing the on-boarding tutorial users are greeted by a request to set up a security option, with a recommendation for biometric security. If the user selects no security they are given a message explaining the importance of device level security. I opted not to remove the "no security" option as I did not want to restrict a users choice.
After a user has selected a security measure, they will be force to enter that again if the app has been in the background for more than 10 minutes.

## Links
[Privacy Policy](https://davidasix.com/mobile-apps/midwife-assist-j955/privacy-policy)

## Like my work?

[<img 
    height='50' 
    style='border:0px;height:50px;' 
    src='https://storage.ko-fi.com/cdn/kofi5.png?v=3' 
    border='0' 
    alt='Buy Me a Coffee at ko-fi.com' />](https://ko-fi.com/davidasix)
