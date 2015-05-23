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
# CHECK USER PRIVILEGES
(( `id -u` )) && echo "This script *must* be ran with root privileges, try prefixing with sudo. i.e sudo $0" && exit 1

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# BEGIN INSTALLATION PROCESS
#
read -p "Do you wish to continue and set up your Raspberry Pi as a File Share? [N] " yn
case $yn in
	[Yy]* )
		clear
		# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
		# SOFTWARE INSTALL
		#
		# update the packages
		echo "Updating apt-get and installing samba, samba-common, libcups2, cifs-utils"
		apt-get update && apt-get install -y samba samba-common libcups2 cifs-utils
		echo ""
		echo "Installing Node.js..."
		wget http://node-arm.herokuapp.com/node_latest_armhf.deb
		sudo dpkg -i node_latest_armhf.deb
		echo ""
		# INSTALLING node.js chat room
		echo "Installing file sharing interface..."
		# go back to our subnodes directory
		cd /home/pi/subnodes-fileshare/

		# download subnodes app dependencies
		npm install
		npm install -g nodemon

		# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
		# COPY OVER THE SAMBA START UP SCRIPT + enable services
		#
		clear
		update-rc.d samba defaults
		cp scripts/subnodes_fileshare.sh /etc/init.d/subnodes_fileshare
		chmod 755 /etc/init.d/subnodes_fileshare
		update-rc.d subnodes_fileshare defaults

		echo "Done!"
	;;
	[Nn]* ) ;;
esac
exit 0;
