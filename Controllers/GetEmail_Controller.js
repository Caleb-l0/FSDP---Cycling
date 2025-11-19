const EmailModel = require('../Models/GetEmail_Model')


async function getOrganisationID(req,res){
try{
    const data = await EmailModel.getOrganisationID();
    res.json(data)
        
    
}
catch(error){
     res.status(500).json({ message: "Server error", error: err.message });
}
}


async function getMemberEmailsByOrganizationID(req,res){
     try {
        const { organizationID } = req.params;

        const data = await getMemberEmailsByOrganizationID(organizationID);

        res.json({
            organizationID,
            count: data.length,
            members: data
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
}

module.exports ={getMemberEmailsByOrganizationID,getOrganisationID}