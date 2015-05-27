#! /bin/bash
#
# Subnodes Fileshare / Samba install script
# Sarah Grant
# Updated 22 May 2015
#
# TO-DO
# 
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# SOME DEFAULT VALUES
#
NAME=subnodes_fileshare

# WIRELESS RADIO DRIVER
RADIO_DRIVER=nl80211

# MESH POINT
#MESH_SSID=meshnode

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CHECK USER PRIVILEGES
(( `id -u` )) && echo "This script *must* be ran with root privileges, try prefixing with sudo. i.e sudo $0" && exit 1
#

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# CHECK USB WIFI HARDWARE IS FOUND
# also, i will need to check for one device per network config for a total of two devices
if [[ -n $(lsusb | grep RT5370) ]]; then
    echo "The RT5370 device has been successfully located."
else
    echo "The RT5370 device has not been located, check it is inserted and run script again when done."
    exit 1
fi

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# BEGIN INSTALLATION PROCESS
#
read -p "Please make sure you have already installed Subnodes at https://github.com/chootka/subnodes.git in order to have node.js installed and networking configured. If you have not, please exit and go back to do so. Do you wish to continue and set up your Raspberry Pi as a File Share? [N] " yn
case $yn in
	[Yy]* )
		clear
		# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
		# SOFTWARE INSTALL
		#
		# update the packages
		# BTW batctl is installed here regardless so the bat0 interface is avaiable for the bridge, 
		# should the user decide to set up an AP. TO-DO: Remove this dependency
		echo "Updating apt-get and installing samba, samba-common, libcups2, cifs-utils" #", iw, batctl"
		apt-get update && apt-get install -y samba samba-common libcups2 cifs-utils #iw batctl
		# echo ""
		# echo "Installing Node.js..."
		# wget http://node-arm.herokuapp.com/node_latest_armhf.deb
		# sudo dpkg -i node_latest_armhf.deb
		echo ""
		# INSTALLING node.js file sharing interface
		echo "Installing file sharing interface..."
		# go back to our subnodes directory
		cd /home/pi/subnodes-fileshare/

		# download subnodes app dependencies
		npm install
		npm install -g nodemon

# 		echo "Configuring Raspberry Pi as a BATMAN-ADV Mesh Point..."
# 		echo ""
# 		echo "Enabling the batman-adv kernel..."
		
# 		# add the batman-adv module to be started on boot
# 		sed -i '$a batman-adv' /etc/modules
# 		modprobe batman-adv;
# 		echo ""
# 		# check that iw list does not fail with 'nl80211 not found'
# 		echo -en "checking that nl80211 USB wifi radio is plugged in...				"
# 		iw list > /dev/null 2>&1 | grep 'nl80211 not found'
# 		rc=$?
# 		if [[ $rc = 0 ]] ; then
# 			echo ""
# 			echo -en "[FAIL]\n"
# 			echo "Make sure you are using a wifi radio that runs via the nl80211 driver."
# 			exit $rc
# 		else
# 			echo -en "[OK]\n"
# 		fi

# 		# ask how they want to configure their mesh point
# 		read -p "Mesh Point SSID [$MESH_SSID]: " -e t1
# 		if [ -n "$t1" ]; then MESH_SSID="$t1";fi

# 		# backup the existing interfaces file
# 		echo -en "Creating backup of network interfaces configuration file... 			"
# 		cp /etc/network/interfaces /etc/network/interfaces.orig.bak
# 		rc=$?
# 		if [[ $rc != 0 ]] ; then
# 			echo -en "[FAIL]\n"
# 			exit $rc
# 		else
# 			echo -en "[OK]\n"
# 		fi

# 		# CONFIGURE /etc/network/interfaces
# 		echo -en "Creating new network interfaces configuration file with your settings... 	"
# 		cat <<EOF > /etc/network/interfaces
# auto lo
# iface lo inet loopback

# auto eth0
# iface eth0 inet dhcp

# iface default inet dhcp
# EOF
# 		rc=$?
# 		if [[ $rc != 0 ]] ; then
#     			echo -en "[FAIL]\n"
# 			echo ""
# 			exit $rc
# 		else
# 			echo -en "[OK]\n"
# 		fi

# 		# pass the selected mesh ssid into mesh startup script
# 		sed -i "s/SSID/$MESH_SSID/" scripts/subnodes_mesh.sh

# 		# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# 		# COPY OVER THE MESH POINT START UP SCRIPT
# 		#
# 		echo ""
# 		echo "Adding startup script for mesh point..."
# 		cp scripts/subnodes_mesh.sh /etc/init.d/subnodes_mesh
# 		chmod 755 /etc/init.d/subnodes_mesh
# 		update-rc.d subnodes_mesh defaults

		# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
		# COPY OVER THE SAMBA START UP SCRIPT + enable services
		#
		clear
		echo "Adding the startup script for the file sharing interface..."
		update-rc.d samba defaults
		cp scripts/$NAME.conf /etc/default/$NAME
		cp scripts/$NAME.sh /etc/init.d/$NAME
		chmod 755 /etc/init.d/$NAME
		update-rc.d $NAME defaults
		echo "Done!"
	;;
	[Nn]* ) ;;
esac
exit 0;
