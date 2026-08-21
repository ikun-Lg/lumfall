module.exports = {
    '/api/project/list':{
        get:{
            query:{
                type: 'object',
                properties: {
                    projectKey: {
                        type: 'string',
                    }
                },
                required: ['projectKey'],
            },
            body:{},
            params:{}
        }
    }
}
